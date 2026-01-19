import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../core/services/geojson_service.dart';
import '../../core/server/api/api_constants.dart';
import '../../../design_system/tokens/colors.dart' as DesignColors;
import '../../../design_system/tokens/spacing.dart';
import '../../../design_system/tokens/typography.dart';
import '../../core/widgets/custom_app_bar_widget.dart';

/// Test page for GeoJSON functionality
/// Use this page to test loading and displaying oblast boundaries
class GeoJsonTestPage extends StatefulWidget {
  const GeoJsonTestPage({super.key});

  @override
  State<GeoJsonTestPage> createState() => _GeoJsonTestPageState();
}

class _GeoJsonTestPageState extends State<GeoJsonTestPage> {
  final GeoJsonService _geoJsonService = GeoJsonService();
  
  bool _isLoading = false;
  String? _errorMessage;
  Map<String, dynamic>? _geoJsonData;
  int _selectedRegionId = 1;

  @override
  void initState() {
    super.initState();
    _loadCurrentUserBoundaries();
  }

  Future<void> _loadCurrentUserBoundaries() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _geoJsonData = null;
    });

    try {
      final data = await _geoJsonService.loadCurrentUserBoundaries();
      
      if (mounted) {
        setState(() {
          _geoJsonData = data;
          _isLoading = false;
          if (data == null) {
            _errorMessage = 'Не удалось загрузить данные';
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Ошибка: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadSpecificRegion(int regionId) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _geoJsonData = null;
      _selectedRegionId = regionId;
    });

    try {
      final data = await _geoJsonService.loadOblastBoundaries(
        regionId: regionId,
        forceRefresh: true,
      );
      
      if (mounted) {
        setState(() {
          _geoJsonData = data;
          _isLoading = false;
          if (data == null) {
            _errorMessage = 'Не удалось загрузить данные для региона $regionId';
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Ошибка: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _clearCache() async {
    await _geoJsonService.clearAllCache();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Кеш очищен')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DesignColors.AppColors.darkBackground,
      appBar: const CustomAppBarWidget(
        title: "GeoJSON Test",
        canPop: true,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildControlPanel(),
            SizedBox(height: AppSpacing.lg),
            _buildContent(),
          ],
        ),
      ),
    );
  }

  Widget _buildControlPanel() {
    return Container(
      padding: EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: DesignColors.AppColors.darkSurfaceVariant,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: DesignColors.AppColors.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Управление',
            style: AppTypography.title(context).copyWith(
              color: DesignColors.AppColors.darkTextPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: AppSpacing.md),
          ElevatedButton.icon(
            onPressed: _isLoading ? null : _loadCurrentUserBoundaries,
            icon: const Icon(Icons.person_outline),
            label: const Text('Загрузить границы текущего пользователя'),
            style: ElevatedButton.styleFrom(
              backgroundColor: DesignColors.AppColors.accentGreen,
              foregroundColor: Colors.white,
              padding: EdgeInsets.all(AppSpacing.md),
            ),
          ),
          SizedBox(height: AppSpacing.sm),
          ElevatedButton.icon(
            onPressed: _isLoading ? null : _clearCache,
            icon: const Icon(Icons.delete_outline),
            label: const Text('Очистить кеш'),
            style: ElevatedButton.styleFrom(
              backgroundColor: DesignColors.AppColors.error,
              foregroundColor: Colors.white,
              padding: EdgeInsets.all(AppSpacing.md),
            ),
          ),
          SizedBox(height: AppSpacing.md),
          Text(
            'Выберите регион:',
            style: AppTypography.bodySmall(context).copyWith(
              color: DesignColors.AppColors.darkTextSecondary,
            ),
          ),
          SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: List.generate(13, (index) {
              final regionId = index + 1;
              final isSelected = regionId == _selectedRegionId;
              return ChoiceChip(
                label: Text(regionId.toString()),
                selected: isSelected,
                onSelected: _isLoading
                    ? null
                    : (selected) {
                        if (selected) {
                          _loadSpecificRegion(regionId);
                        }
                      },
                backgroundColor: DesignColors.AppColors.darkSurface,
                selectedColor: DesignColors.AppColors.accentGreen,
                labelStyle: TextStyle(
                  color: isSelected
                      ? Colors.white
                      : DesignColors.AppColors.darkTextSecondary,
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.xxl),
          child: Column(
            children: [
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation(DesignColors.AppColors.accentGreen),
              ),
              SizedBox(height: AppSpacing.md),
              Text(
                'Загрузка GeoJSON...',
                style: AppTypography.body(context).copyWith(
                  color: DesignColors.AppColors.darkTextSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_errorMessage != null) {
      return Container(
        padding: EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: DesignColors.AppColors.error.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: DesignColors.AppColors.error),
        ),
        child: Column(
          children: [
            Icon(
              Icons.error_outline,
              color: DesignColors.AppColors.error,
              size: 48.sp,
            ),
            SizedBox(height: AppSpacing.md),
            Text(
              _errorMessage!,
              style: AppTypography.body(context).copyWith(
                color: DesignColors.AppColors.error,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    if (_geoJsonData == null) {
      return Container(
        padding: EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: DesignColors.AppColors.darkSurfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: DesignColors.AppColors.darkBorder),
        ),
        child: Text(
          'Нет данных. Нажмите кнопку для загрузки.',
          style: AppTypography.body(context).copyWith(
            color: DesignColors.AppColors.darkTextSecondary,
          ),
          textAlign: TextAlign.center,
        ),
      );
    }

    return _buildGeoJsonInfo(_geoJsonData!);
  }

  Widget _buildGeoJsonInfo(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    final features = data['features'] as List?;
    final oblastSlug = ApiParams.getOblastSlug(_selectedRegionId);

    return Container(
      padding: EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: DesignColors.AppColors.darkSurfaceVariant,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: DesignColors.AppColors.accentGreen),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.check_circle,
                color: DesignColors.AppColors.accentGreen,
                size: 24.sp,
              ),
              SizedBox(width: AppSpacing.sm),
              Text(
                'GeoJSON загружен',
                style: AppTypography.title(context).copyWith(
                  color: DesignColors.AppColors.darkTextPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          SizedBox(height: AppSpacing.md),
          _buildInfoRow('Oblast Slug:', oblastSlug),
          _buildInfoRow('Type:', type ?? 'Unknown'),
          _buildInfoRow('Features:', features?.length.toString() ?? '0'),
          if (features != null && features.isNotEmpty) ...[
            SizedBox(height: AppSpacing.md),
            Text(
              'Feature Details:',
              style: AppTypography.bodySmall(context).copyWith(
                color: DesignColors.AppColors.darkTextSecondary,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: AppSpacing.sm),
            ...features.take(3).map((feature) {
              final geometry = feature['geometry'] as Map<String, dynamic>?;
              final properties = feature['properties'] as Map<String, dynamic>?;
              return Padding(
                padding: EdgeInsets.only(bottom: AppSpacing.sm),
                child: Container(
                  padding: EdgeInsets.all(AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: DesignColors.AppColors.darkSurface,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildInfoRow('  Type:', geometry?['type'] ?? 'Unknown'),
                      if (properties != null)
                        _buildInfoRow('  Properties:', properties.keys.join(', ')),
                    ],
                  ),
                ),
              );
            }),
            if (features.length > 3)
              Text(
                '... и еще ${features.length - 3} features',
                style: AppTypography.caption(context).copyWith(
                  color: DesignColors.AppColors.darkTextTertiary,
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: AppSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: AppTypography.bodySmall(context).copyWith(
              color: DesignColors.AppColors.darkTextSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              value,
              style: AppTypography.bodySmall(context).copyWith(
                color: DesignColors.AppColors.darkTextPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
