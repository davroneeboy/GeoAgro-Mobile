import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lottie/lottie.dart';

import '../../../../core/widgets/custom_app_bar_widget.dart';
import '../../../../core/widgets/error_state_widget.dart';
import '../../../../core/widgets/custom_card_widget.dart';
import '../../../../core/widgets/custom_list_tile_widget.dart';
import '../../../../core/widgets/custom_driver.dart';
import '../../../../core/setting/setup.dart';
import '../../../../data/repository/app_repository_impl.dart';
import '../../../../data/model/plantation/edit_plantation.dart';

final plantationViewVM = ChangeNotifierProvider.autoDispose.family<_PlantationViewVm, int>((ref, id) {
  return _PlantationViewVm(id);
});

class _PlantationViewVm extends ChangeNotifier {
  final AppRepositoryImpl _repo = AppRepositoryImpl();
  final int plantationId;
  
  bool isLoading = true;
  String? errorMessage;
  EditPlantationModel? plantation;

  _PlantationViewVm(this.plantationId) {
    _loadPlantation();
  }

  Future<void> _loadPlantation() async {
    try {
      isLoading = true;
      errorMessage = null;
      notifyListeners();

      final data = await _repo.getPlantationDetail(id: plantationId);
      if (data == null) {
        errorMessage = "Ma'lumotlar topilmadi";
      } else {
        plantation = editPlantationModelFromJson(data);
      }
    } catch (e) {
      errorMessage = "Xatolik yuz berdi: $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void retry() => _loadPlantation();
}

class PlantationViewPage extends ConsumerWidget {
  final int id;
  const PlantationViewPage({super.key, required this.id});

  // Вспомогательная функция для форматирования чисел без .0
  String _formatNumber(dynamic value) {
    if (value == null) return "0";
    if (value is double) {
      return value == value.toInt().toDouble() ? value.toInt().toString() : value.toString();
    }
    if (value is int) {
      return value.toString();
    }
    return value.toString();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vm = ref.watch(plantationViewVM(id));

    if (vm.isLoading) {
      return Scaffold(
        appBar: const CustomAppBarWidget(title: "Ko'rish", canPop: true),
        body: Center(
          child: Lottie.asset('assets/lotties/search.json', width: 300.w, height: 300.h),
        ),
      );
    }

    if (vm.errorMessage != null) {
      return Scaffold(
        appBar: const CustomAppBarWidget(title: "Ko'rish", canPop: true),
        body: ErrorStateWidget(
          errorMessage: vm.errorMessage!,
          onTap: vm.retry,
        ),
      );
    }

    final plantation = vm.plantation!;
    return Scaffold(
      appBar: const CustomAppBarWidget(title: "Plantatsiya ma'lumotlari", canPop: true),
      body: SingleChildScrollView(
        padding: REdgeInsets.all(16),
        child: Column(
          children: [
            // Basic Info
            CustomCardWidget(
              horizontal: 16,
              vertical: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Asosiy ma'lumotlar", 
                    style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w600)),
                  16.verticalSpace,
                  CustomListTileWidget(
                    title: "Bog' tashkil topgan yil",
                    contextText: "${plantation.gardenEstablishedYear ?? 'Noma\'lum'}",
                  ),
                  12.verticalSpace,
                  const CustomDriver(),
                  12.verticalSpace,
                  CustomListTileWidget(
                    title: "Plantatsiya turi",
                    contextText: plantatiopnType[plantation.plantationType] ?? "Noma'lum",
                  ),
                  12.verticalSpace,
                  const CustomDriver(),
                  12.verticalSpace,
                  CustomListTileWidget(
                    title: "Umumiy maydon",
                    contextText: "${_formatNumber(plantation.totalArea)} ga",
                  ),
                  12.verticalSpace,
                  const CustomDriver(),
                  12.verticalSpace,
                  CustomListTileWidget(
                    title: "Sug'oriladigan maydon",
                    contextText: "${_formatNumber(plantation.irrigationArea)} ga",
                  ),
                  12.verticalSpace,
                  const CustomDriver(),
                  12.verticalSpace,
                  CustomListTileWidget(
                    title: "Yer turi",
                    contextText: yerTuri[plantation.landType] ?? "Noma'lum",
                  ),
                  12.verticalSpace,
                  const CustomDriver(),
                  12.verticalSpace,
                  CustomListTileWidget(
                    title: "Unumdorlik",
                    contextText: "${plantation.fertilityScore?.toStringAsFixed(1) ?? 0}%",
                  ),
                  12.verticalSpace,
                  const CustomDriver(),
                  12.verticalSpace,
                  CustomListTileWidget(
                    title: "Unumdormi",
                    contextText: plantation.isFertile == true ? "Ha" : "Yo'q",
                  ),
                ],
              ),
            ),
            16.verticalSpace,
            
            // Fruit Areas
            if (plantation.fruitAreas?.isNotEmpty == true) ...[
              CustomCardWidget(
                horizontal: 16,
                vertical: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Meva maydonlari", 
                      style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w600)),
                    16.verticalSpace,
                    ...plantation.fruitAreas!.asMap().entries.map((entry) {
                      final fruit = entry.value;
                      return Column(
                        children: [
                          if (entry.key > 0) ...[
                            12.verticalSpace,
                            const CustomDriver(),
                            12.verticalSpace,
                          ],
                          CustomListTileWidget(
                            title: "Meva",
                            contextText: fruit.fruitName ?? fruit.fruit?.toString() ?? "Noma'lum",
                          ),
                          8.verticalSpace,
                          CustomListTileWidget(
                            title: "Nav",
                            contextText: fruit.varietyName ?? fruit.variety?.toString() ?? "Noma'lum",
                          ),
                          8.verticalSpace,
                          CustomListTileWidget(
                            title: "Maydon",
                            contextText: "${_formatNumber(fruit.area)} ga",
                          ),
                          if (fruit.plantedYear != null) ...[
                            8.verticalSpace,
                            CustomListTileWidget(
                              title: "Ekilgan yil",
                              contextText: fruit.plantedYear.toString(),
                            ),
                          ],
                        ],
                      );
                    }),
                  ],
                ),
              ),
              16.verticalSpace,
            ],

            // Investments
            if (plantation.investments?.isNotEmpty == true) ...[
              CustomCardWidget(
                horizontal: 16,
                vertical: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Investitsiyalar", 
                      style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w600)),
                    16.verticalSpace,
                    ...plantation.investments!.asMap().entries.map((entry) {
                      final investment = entry.value;
                      return Column(
                        children: [
                          if (entry.key > 0) ...[
                            12.verticalSpace,
                            const CustomDriver(),
                            12.verticalSpace,
                          ],
                          CustomListTileWidget(
                            title: investment.investType == 1 ? "Mahalliy" : "Xorijiy",
                            contextText: _formatNumber(investment.investmentAmount),
                          ),
                        ],
                      );
                    }),
                  ],
                ),
              ),
              16.verticalSpace,
            ],

            // Subsidies
            if (plantation.subsidies?.isNotEmpty == true) ...[
              CustomCardWidget(
                horizontal: 16,
                vertical: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Subsidiyalar", 
                      style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w600)),
                    16.verticalSpace,
                    ...plantation.subsidies!.asMap().entries.map((entry) {
                      final subsidy = entry.value;
                      return Column(
                        children: [
                          if (entry.key > 0) ...[
                            12.verticalSpace,
                            const CustomDriver(),
                            12.verticalSpace,
                          ],
                          CustomListTileWidget(
                            title: "Yil",
                            contextText: subsidy.year?.toString() ?? "Noma'lum",
                          ),
                          8.verticalSpace,
                          CustomListTileWidget(
                            title: "Shartnoma raqami",
                            contextText: subsidy.contractNumber ?? "Noma'lum",
                          ),
                          8.verticalSpace,
                          CustomListTileWidget(
                            title: "Miqdor",
                            contextText: "${subsidy.amount ?? 0}",
                          ),
                        ],
                      );
                    }),
                  ],
                ),
              ),
              16.verticalSpace,
            ],

            // Images
            if (plantation.images?.isNotEmpty == true) ...[
              CustomCardWidget(
                horizontal: 16,
                vertical: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Bog'ning rasmlari", 
                      style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w600)),
                    16.verticalSpace,
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 12.w,
                        mainAxisSpacing: 12.h,
                        childAspectRatio: 1.0,
                      ),
                      itemCount: plantation.images!.length,
                      itemBuilder: (context, index) {
                        final imageUrl = plantation.images![index];
                        return GestureDetector(
                          onTap: () => _showImageDialog(context, imageUrl),
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8.r),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8.r),
                              child: Image.network(
                                imageUrl,
                                fit: BoxFit.cover,
                                loadingBuilder: (context, child, loadingProgress) {
                                  if (loadingProgress == null) return child;
                                  return Container(
                                    color: Colors.grey.shade100,
                                    child: Center(
                                      child: CircularProgressIndicator(
                                        value: loadingProgress.expectedTotalBytes != null
                                            ? loadingProgress.cumulativeBytesLoaded / 
                                              loadingProgress.expectedTotalBytes!
                                            : null,
                                        strokeWidth: 2,
                                      ),
                                    ),
                                  );
                                },
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    color: Colors.grey.shade100,
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.broken_image, 
                                          size: 32.sp, color: Colors.grey),
                                        4.verticalSpace,
                                        Text("Rasm yuklanmadi", 
                                          style: TextStyle(fontSize: 12.sp, color: Colors.grey)),
                                      ],
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              16.verticalSpace,
            ],
          ],
        ),
      ),
    );
  }

  void _showImageDialog(BuildContext context, String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                child: Image.network(
                  imageUrl,
                  fit: BoxFit.contain,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      width: 200.w,
                      height: 200.h,
                      color: Colors.black54,
                      child: Center(
                        child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded / 
                                loadingProgress.expectedTotalBytes!
                              : null,
                          color: Colors.white,
                        ),
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      width: 200.w,
                      height: 200.h,
                      color: Colors.black54,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.broken_image, size: 48.sp, color: Colors.white),
                          8.verticalSpace,
                          Text("Rasm yuklanmadi", 
                            style: TextStyle(color: Colors.white, fontSize: 16.sp)),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
            Positioned(
              top: 40.h,
              right: 20.w,
              child: GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: Container(
                  padding: EdgeInsets.all(8.w),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20.r),
                  ),
                  child: Icon(Icons.close, color: Colors.white, size: 24.sp),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


