from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Organization, UserProfile, Product, GlobalSetting

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='profile.organization.name', read_only=True)
    organization_id = serializers.CharField(source='profile.organization.id', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'organization_id', 'organization_name']

class ProductSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'description', 
            'quantity_on_hand', 'cost_price', 'selling_price', 
            'low_stock_threshold', 'is_low_stock', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_is_low_stock(self, obj):
        # We need organization default if product threshold is none
        threshold = obj.low_stock_threshold
        if threshold is None:
            try:
                threshold = obj.organization.settings.default_low_stock_threshold
            except GlobalSetting.DoesNotExist:
                threshold = 5
        return obj.quantity_on_hand <= threshold

class GlobalSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSetting
        fields = ['default_low_stock_threshold']
