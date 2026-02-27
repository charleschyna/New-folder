"""
EchoTutor AI Teaching Engine
==============================
Handles all LLM interactions: lesson generation, interruption responses,
greetings, and command handling. Falls back gracefully when no API key
is configured (demo mode with mock responses).
"""
import os
import re
import json
import logging
from datetime import datetime
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# ── OpenAI client (lazy init, re-checks .env on every cold start) ─────────────
_openai_client = None
_loaded_key    = None   # track which key the client was built with


def _get_openai():
    global _openai_client, _loaded_key
    # Re-read .env so a key added after server start is picked up automatically
    try:
        from dotenv import load_dotenv
        load_dotenv(override=True)
    except ImportError:
        pass

    api_key = os.environ.get('OPENROUTER_API_KEY', '').strip()

    # Rebuild client if the key changed (or was just added)
    if api_key and api_key != _loaded_key:
        try:
            from openai import OpenAI
            _openai_client = OpenAI(
                api_key=api_key,
                base_url='https://openrouter.ai/api/v1',
                default_headers={
                    'HTTP-Referer': 'https://echotutor.app',
                    'X-Title': 'EchoTutor',
                },
            )
            _loaded_key = api_key
            logger.info('OpenRouter client initialised.')
        except Exception as e:
            logger.warning(f'Could not init OpenRouter client — running in demo mode. ({e})')
            _openai_client = None

    return _openai_client if _loaded_key else None


# ── Block parser ──────────────────────────────────────────────────────────────

def parse_lesson_blocks(raw_text: str) -> List[Dict]:
    """
    Parse the LLM output into structured blocks understood by the frontend.

    Each block has:
        type:    'speech' | 'write' | 'draw' | 'pause'
        content: the text or instruction
        id:      sequential integer
    """
    blocks = []
    block_id = 0
    current_type = None
    current_lines = []

    TYPES = {'SPEECH': 'speech', 'WRITE': 'write', 'DRAW': 'draw', 'PAUSE': 'pause'}

    def flush():
        nonlocal current_type, current_lines
        if current_type and current_lines:
            content = ' '.join(current_lines).strip()
            if content:
                blocks.append({
                    'id': len(blocks),
                    'type': current_type,
                    'content': content,
                })
        current_lines = []

    for line in raw_text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        matched = False
        for keyword, block_type in TYPES.items():
            if stripped.upper().startswith(keyword + ':'):
                flush()
                current_type = block_type
                rest = stripped[len(keyword) + 1:].strip()
                if rest:
                    current_lines = [rest]
                else:
                    current_lines = []
                matched = True
                break

        if not matched and current_type:
            current_lines.append(stripped)

    flush()
    return blocks


# ── Demo / fallback responses ─────────────────────────────────────────────────

DEMO_LESSON = {
    "quadratic equations": [
        {"id": 0, "type": "speech", "content": "Great choice! Quadratic equations are everywhere — from calculating how high a ball goes to designing bridges. Let's dive in!"},
        {"id": 1, "type": "write", "content": "ax² + bx + c = 0"},
        {"id": 2, "type": "speech", "content": "This is the standard form. The letters a, b, and c are just numbers we know — and x is the mystery value we want to find."},
        {"id": 3, "type": "speech", "content": "The most powerful tool we have is the quadratic formula. It works for every quadratic equation, no matter how tricky."},
        {"id": 4, "type": "write", "content": "x = (−b ± √(b²− 4ac)) / 2a"},
        {"id": 5, "type": "pause", "content": "Take a moment to look at that formula. Does the structure make sense so far?"},
        {"id": 6, "type": "speech", "content": "Let's try a real example together. We'll use: 2x² + 5x + 3 = 0"},
        {"id": 7, "type": "write", "content": "a = 2,  b = 5,  c = 3"},
        {"id": 8, "type": "speech", "content": "Now we plug these into the formula. Under the square root we calculate b² minus 4ac."},
        {"id": 9, "type": "write", "content": "b²− 4ac = 25 − 24 = 1"},
        {"id": 10, "type": "speech", "content": "The square root of 1 is just 1. So our two answers are: x = (−5 + 1) / 4  and  x = (−5 − 1) / 4"},
        {"id": 11, "type": "write", "content": "x = −1   or   x = −3/2"},
        {"id": 12, "type": "pause", "content": "And those are our solutions! How does that feel? Would you like to try one yourself, or shall I explain any part again?"},
    ],
    "default": [
        {"id": 0, "type": "speech", "content": "Wonderful! I love exploring new topics. Let me break this down for you in a way that makes total sense."},
        {"id": 1, "type": "speech", "content": "Think of this concept like building blocks — we start with the simplest idea and layer understanding on top, one piece at a time."},
        {"id": 2, "type": "write", "content": "Key Concept: Starting from the basics"},
        {"id": 3, "type": "speech", "content": "The most important thing to understand first is the core idea. Everything else builds from here."},
        {"id": 4, "type": "pause", "content": "Does this make sense so far? Feel free to ask me anything at all!"},
        {"id": 5, "type": "speech", "content": "Now let's look at a concrete example to make this real and memorable."},
        {"id": 6, "type": "write", "content": "Example → Real-world application"},
        {"id": 7, "type": "speech", "content": "You're doing brilliantly! This is the kind of thinking that makes learning click. Any questions before we move on?"},
        {"id": 8, "type": "pause", "content": "Ready to continue? We're building something great here!"},
    ]
}


def _demo_lesson(topic: str) -> List[Dict]:
    topic_lower = topic.lower()
    for key in DEMO_LESSON:
        if key != 'default' and key in topic_lower:
            return DEMO_LESSON[key]
    demo = DEMO_LESSON['default'].copy()
    demo[1] = {**demo[1], "content": f"I'm excited to teach you about {topic}! Let's break it down step by step."}
    demo[2] = {**demo[2], "content": f"Topic: {topic}"}
    return demo


def _demo_interruption(question: str) -> List[Dict]:
    return [
        {"id": 0, "type": "speech", "content": f"That's a great question — '{question}' — I'm really glad you asked that!"},
        {"id": 1, "type": "speech", "content": "Let me address that directly. The key insight here is to focus on the underlying idea rather than memorising a formula."},
        {"id": 2, "type": "write", "content": "Your question → Great thinking!"},
        {"id": 3, "type": "speech", "content": "I hope that clears things up. Shall we carry on from where we were?"},
        {"id": 4, "type": "pause", "content": "You're asking exactly the right questions. That's how real learning happens!"},
    ]


# ── Core engine functions ─────────────────────────────────────────────────────

def generate_greeting(
    student_name: str,
    last_topic: Optional[str] = None,
    total_sessions: int = 0,
) -> str:
    """Return a personalised spoken greeting for the avatar."""
    hour = datetime.now().hour
    if hour < 12:
        time_of_day = "morning"
    elif hour < 17:
        time_of_day = "afternoon"
    else:
        time_of_day = "evening"

    client = _get_openai()
    if client:
        from .prompts import SYSTEM_PROMPT, GREETING_PROMPT_TEMPLATE
        prompt = GREETING_PROMPT_TEMPLATE.format(
            student_name=student_name,
            time_of_day=time_of_day,
            last_topic=last_topic or "nothing yet",
            total_sessions=total_sessions,
        )
        try:
            model = os.environ.get('OPENROUTER_MODEL', 'openai/gpt-4o')
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=200,
                temperature=0.8,
            )
            raw = response.choices[0].message.content.strip()
            # Extract the SPEECH content
            match = re.search(r'SPEECH:\s*(.+)', raw, re.DOTALL)
            return match.group(1).strip() if match else raw
        except Exception as e:
            logger.error(f"OpenRouter greeting error: {e}")

    # Demo fallback
    if total_sessions == 0:
        return (
            f"Hello {student_name}, welcome to EchoTutor! "
            f"I'm Echo, your personal AI tutor. "
            f"I'm so excited to learn with you today. "
            f"What would you like to explore first?"
        )
    elif last_topic:
        return (
            f"Good {time_of_day}, {student_name}! "
            f"Great to see you back. Last time we were exploring {last_topic}. "
            f"Shall we continue, or is there something new on your mind today?"
        )
    else:
        return (
            f"Welcome back, {student_name}! "
            f"Wonderful to see you again this {time_of_day}. "
            f"What would you like to learn today?"
        )


def generate_lesson(
    topic: str,
    student_name: str = "Student",
    pace: str = "normal",
    style: str = "auditory",
    conversation_history: Optional[List] = None,
) -> List[Dict]:
    """
    Generate a full structured lesson for the given topic.
    Returns a list of blocks: [{id, type, content}, ...]
    """
    client = _get_openai()
    if client:
        from .prompts import SYSTEM_PROMPT, LESSON_PROMPT_TEMPLATE
        history_str = _format_history(conversation_history or [])
        prompt = LESSON_PROMPT_TEMPLATE.format(
            student_name=student_name,
            topic=topic,
            pace=pace,
            style=style,
            history=history_str or "No prior conversation.",
        )
        try:
            model = os.environ.get('OPENROUTER_MODEL', 'openai/gpt-4o')
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1500,
                temperature=0.75,
            )
            raw = response.choices[0].message.content
            blocks = parse_lesson_blocks(raw)
            if blocks:
                return blocks
        except Exception as e:
            logger.error(f"OpenRouter lesson generation error: {e}")

    # Fallback to demo lesson
    return _demo_lesson(topic)


def respond_to_interruption(
    question: str,
    context: str = "",
    student_name: str = "Student",
    conversation_history: Optional[List] = None,
) -> List[Dict]:
    """
    Generate a focused response to a student's mid-lesson interruption.
    Returns a concise list of blocks.
    """
    client = _get_openai()
    if client:
        from .prompts import SYSTEM_PROMPT, INTERRUPTION_PROMPT_TEMPLATE
        prompt = INTERRUPTION_PROMPT_TEMPLATE.format(
            student_name=student_name,
            question=question,
            context=context or "Lesson in progress.",
        )
        try:
            model = os.environ.get('OPENROUTER_MODEL', 'openai/gpt-4o')
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=800,
                temperature=0.7,
            )
            raw = response.choices[0].message.content
            blocks = parse_lesson_blocks(raw)
            if blocks:
                return blocks
        except Exception as e:
            logger.error(f"OpenRouter interruption error: {e}")

    return _demo_interruption(question)


def handle_command(
    command: str,
    context: str = "",
    student_name: str = "Student",
) -> List[Dict]:
    """
    Handle a named voice command (repeat, slower, faster, example, etc.).
    """
    from .prompts import SYSTEM_PROMPT, COMMAND_RESPONSES

    command_instruction = COMMAND_RESPONSES.get(command, COMMAND_RESPONSES.get('repeat', ''))
    full_prompt = f"Student context:\n{context}\n\nInstruction:\n{command_instruction}"

    client = _get_openai()
    if client:
        try:
            model = os.environ.get('OPENROUTER_MODEL', 'openai/gpt-4o')
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": full_prompt},
                ],
                max_tokens=800,
                temperature=0.7,
            )
            raw = response.choices[0].message.content
            blocks = parse_lesson_blocks(raw)
            if blocks:
                return blocks
        except Exception as e:
            logger.error(f"OpenRouter command error: {e}")

    # Demo command responses
    command_demos = {
        "repeat": [
            {"id": 0, "type": "speech", "content": "Of course! Let me explain that again, this time with a slightly different angle."},
            {"id": 1, "type": "speech", "content": "The core idea is simpler than it might seem. Let's strip it back to the basics."},
            {"id": 2, "type": "pause", "content": "Does that version make more sense?"},
        ],
        "slower": [
            {"id": 0, "type": "speech", "content": "Absolutely, let's slow right down. There's no rush here at all."},
            {"id": 1, "type": "speech", "content": "Let me take this one tiny piece at a time and really make sure each part is crystal clear."},
            {"id": 2, "type": "pause", "content": "Let me know whenever you're ready to move forward."},
        ],
        "faster": [
            {"id": 0, "type": "speech", "content": "Got it! You're clearly ahead of the curve. Let me fast-track to the main points."},
            {"id": 1, "type": "speech", "content": "Here's the summary of what matters most."},
        ],
        "example": [
            {"id": 0, "type": "speech", "content": "Great idea — examples always make things click! Here's a real-world one."},
            {"id": 1, "type": "write", "content": "Real-world example →"},
            {"id": 2, "type": "speech", "content": "Think about it this way in everyday life. Does that help make it more concrete?"},
        ],
        "summarize": [
            {"id": 0, "type": "speech", "content": "Great — let me quickly recap what we've covered so far."},
            {"id": 1, "type": "write", "content": "Summary of key points:"},
            {"id": 2, "type": "speech", "content": "Those are the core ideas. You've made excellent progress today!"},
        ],
        "why": [
            {"id": 0, "type": "speech", "content": "That's one of my favourite questions — the 'why' is what makes learning meaningful!"},
            {"id": 1, "type": "speech", "content": "The reason this matters is because it connects to something you already understand intuitively."},
            {"id": 2, "type": "pause", "content": "Does the reasoning behind it make more sense now?"},
        ],
        "steps": [
            {"id": 0, "type": "speech", "content": "Perfect — let's go step by step, nice and clearly."},
            {"id": 1, "type": "write", "content": "Step 1 →"},
            {"id": 2, "type": "write", "content": "Step 2 →"},
            {"id": 3, "type": "write", "content": "Step 3 →"},
            {"id": 4, "type": "speech", "content": "Following those steps in order will always get you to the answer. Shall we walk through an example?"},
        ],
    }
    return command_demos.get(command, command_demos["repeat"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _format_history(history: List[Dict]) -> str:
    lines = []
    for msg in history[-10:]:  # last 10 messages for context
        role = msg.get('role', 'unknown').upper()
        content = msg.get('content', '')
        lines.append(f"{role}: {content}")
    return '\n'.join(lines)
