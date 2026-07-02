from rest_framework import viewsets, status, permissions, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError, models
from django.db.models import Sum


from .models import Organization, UserProfile, Product, GlobalSetting
from .serializers import (
    UserSerializer, ProductSerializer, 
    GlobalSettingSerializer, OrganizationSerializer
)

from rest_framework.authtoken.models import Token

class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        org_name = request.data.get('organization_name')

        if not email or not password or not org_name:
            return Response(
                {"error": "Email, password, and organization name are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Create Organization
            org = Organization.objects.create(name=org_name)
            
            # Create Global Settings for Org
            GlobalSetting.objects.create(organization=org)
            
            # Create User
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password
            )
            
            # Link User and Org
            UserProfile.objects.create(user=user, organization=org)
            
            # Create token
            token, _ = Token.objects.get_or_create(user=user)
            
            serializer = UserSerializer(user)
            return Response({
                "token": token.key,
                "user": serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except IntegrityError:
            return Response(
                {"error": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {"error": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=email, password=password)
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            serializer = UserSerializer(user)
            return Response({
                "token": token.key,
                "user": serializer.data
            })
        else:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({"message": "Successfully logged out."})

class SessionView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user and request.user.is_authenticated:
            serializer = UserSerializer(request.user)
            return Response({"authenticated": True, "user": serializer.data})
        return Response({"authenticated": False})

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Scope to user's organization
        org = self.request.user.profile.organization
        queryset = Product.objects.filter(organization=org)
        
        # Add simple client search
        search_query = self.request.query_params.get('q', None)
        if search_query:
            queryset = queryset.filter(
                models.Q(name__icontains=search_query) | 
                models.Q(sku__icontains=search_query)
            )
        return queryset

    def perform_create(self, serializer):
        org = self.request.user.profile.organization
        sku = self.request.data.get('sku')
        if Product.objects.filter(organization=org, sku=sku).exists():
            raise serializers.ValidationError({"sku": "A product with this SKU already exists in your organization."})
        serializer.save(organization=org)

    def perform_update(self, serializer):
        org = self.request.user.profile.organization
        sku = self.request.data.get('sku')
        product_id = self.kwargs.get('pk')
        if sku and Product.objects.filter(organization=org, sku=sku).exclude(id=product_id).exists():
            raise serializers.ValidationError({"sku": "A product with this SKU already exists in your organization."})
        serializer.save()

    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        product = self.get_object()
        adjustment = request.data.get('adjustment')
        
        try:
            adjustment = int(adjustment)
        except (ValueError, TypeError):
            return Response(
                {"error": "Adjustment must be an integer (e.g., +10, -5)."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        product.quantity_on_hand += adjustment
        if product.quantity_on_hand < 0:
            product.quantity_on_hand = 0 # Avoid negative stock unless specified, standard safety check
        product.save()
        
        serializer = self.get_serializer(product)
        return Response(serializer.data)

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org = request.user.profile.organization
        products = Product.objects.filter(organization=org)
        
        total_products = products.count()
        total_quantity = products.aggregate(total=Sum('quantity_on_hand'))['total'] or 0
        
        # Get low stock threshold default for organization
        try:
            default_threshold = org.settings.default_low_stock_threshold
        except GlobalSetting.DoesNotExist:
            default_threshold = 5

        # Check each product for low stock
        low_stock_items = []
        for p in products:
            threshold = p.low_stock_threshold if p.low_stock_threshold is not None else default_threshold
            if p.quantity_on_hand <= threshold:
                low_stock_items.append({
                    "id": p.id,
                    "name": p.name,
                    "sku": p.sku,
                    "quantity_on_hand": p.quantity_on_hand,
                    "low_stock_threshold": threshold
                })
        
        return Response({
            "total_products": total_products,
            "total_quantity": total_quantity,
            "low_stock_count": len(low_stock_items),
            "low_stock_items": low_stock_items
        })

class SettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org = request.user.profile.organization
        try:
            setting = org.settings
        except GlobalSetting.DoesNotExist:
            setting = GlobalSetting.objects.create(organization=org)
            
        return Response({
            "organization_name": org.name,
            "default_low_stock_threshold": setting.default_low_stock_threshold
        })

    def put(self, request):
        org = request.user.profile.organization
        try:
            setting = org.settings
        except GlobalSetting.DoesNotExist:
            setting = GlobalSetting.objects.create(organization=org)

        org_name = request.data.get('organization_name')
        default_threshold = request.data.get('default_low_stock_threshold')

        if org_name:
            org.name = org_name
            org.save()

        if default_threshold is not None:
            try:
                setting.default_low_stock_threshold = int(default_threshold)
                setting.save()
            except ValueError:
                return Response(
                    {"error": "Threshold must be an integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response({
            "organization_name": org.name,
            "default_low_stock_threshold": setting.default_low_stock_threshold
        })
