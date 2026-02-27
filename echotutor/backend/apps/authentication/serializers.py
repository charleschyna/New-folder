from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = (
            'email', 'username', 'first_name', 'last_name',
            'password', 'password2',
            'preferred_pace', 'learning_style',
        )
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    accessibility = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'preferred_pace', 'learning_style', 'favorite_subjects',
            'high_contrast', 'large_text', 'dyslexia_font', 'voice_only_mode',
            'reduce_motion', 'avatar_id', 'tutor_name',
            'accessibility', 'created_at', 'last_active',
        )
        read_only_fields = ('id', 'email', 'created_at', 'full_name')

    def get_accessibility(self, obj):
        return obj.get_accessibility_settings()


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name',
            'preferred_pace', 'learning_style', 'favorite_subjects',
            'high_contrast', 'large_text', 'dyslexia_font', 'voice_only_mode',
            'reduce_motion', 'avatar_id', 'tutor_name',
        )


class AccessibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'high_contrast', 'large_text', 'dyslexia_font',
            'voice_only_mode', 'reduce_motion',
        )
