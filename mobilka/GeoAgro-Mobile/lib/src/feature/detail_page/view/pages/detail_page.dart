import 'package:agro_employee_public/src/core/setting/setup.dart';
import 'package:agro_employee_public/src/core/widgets/mian_text.dart';
import 'package:agro_employee_public/src/feature/detail_page/view/widgets/add_subsidiya_bottom_shit.dart';
import 'package:agro_employee_public/src/feature/detail_page/view/widgets/border_widget.dart';
import 'package:agro_employee_public/src/feature/detail_page/view/widgets/created_time_widget.dart';
import 'package:agro_employee_public/src/feature/detail_page/view/widgets/add_fruit_area.dart';
import 'package:agro_employee_public/src/feature/detail_page/view/widgets/productivity_indicator_widget.dart';
import 'package:agro_employee_public/src/feature/detail_page/view/widgets/subsidiya_button.dart';
import 'package:agro_employee_public/src/feature/detail_page/view/widgets/add_subsidy_list.dart';
import 'package:agro_employee_public/src/feature/detail_page/view/widgets/switch_card_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';

import 'package:agro_employee_public/design_system/theme/colors.dart'
    as DesignColors;
import 'package:agro_employee_public/design_system/theme/radius.dart';
import 'package:agro_employee_public/design_system/theme/spacing.dart';
import 'package:agro_employee_public/design_system/theme/typography.dart';

import '../../../../core/style/app_colors.dart';
import '../../../../core/utils/utils.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';

import '../../../../data/model/plantation/new_plantation_model.dart';
import '../../vm/detail_vm.dart';
import '../widgets/detail_dropdown_widget.dart';
import '../widgets/detail_text_fild_widget.dart';
import '../widgets/fruit_button.dart';
import '../widgets/images_upload_widget.dart';
import '../../../../core/utils/thousands_separator_input_formatter.dart';
import '../../../home/view/pages/home_page.dart';

class DetailPage extends ConsumerStatefulWidget {
  final Map<String, dynamic> model;
  const DetailPage({super.key, required this.model});

  @override
  DetailPageState createState() => DetailPageState();
}

class DetailPageState extends ConsumerState<DetailPage> {
  @override
  void didChangeDependencies() {
    // Преобразуем userLocation из dynamic в Map<String, double>
    // userLocation всегда должен быть передан, так как карта всегда зумится к местоположению
    Map<String, double> userLocation;
    try {
      final location = widget.model["userLocation"] as Map<String, dynamic>;
      userLocation = {
        'latitude': (location['latitude'] as num).toDouble(),
        'longitude': (location['longitude'] as num).toDouble(),
      };
      debugPrint("✅ DetailPage: Parsed userLocation: $userLocation");
      debugPrint("✅ DetailPage: userLocation type: ${userLocation.runtimeType}");
      debugPrint("✅ DetailPage: userLocation['latitude']: ${userLocation['latitude']}");
      debugPrint("✅ DetailPage: userLocation['longitude']: ${userLocation['longitude']}");
    } catch (e) {
      debugPrint("❌ DetailPage: Error parsing userLocation: $e");
      debugPrint("❌ DetailPage: widget.model['userLocation']: ${widget.model['userLocation']}");
      // В случае ошибки используем дефолтное местоположение
      userLocation = {
        'latitude': 41.311081,
        'longitude': 69.240562,
      };
    }
    
    debugPrint("📤 DetailPage: Calling setValue with userLocation: $userLocation");
    ref.read(detailVM).setValue(
        id: widget.model["farmerId"] as int,
        coordinate: widget.model["coordinates"] as List<Coordinate>,
        userLocation: userLocation);
    debugPrint("✅ DetailPage: setValue called successfully");
    super.didChangeDependencies();
  }

  @override
  Widget build(BuildContext context) {
    final detailVm = ref.watch(detailVM);
    final isTomchi = ref.watch(detailVm.switchTomchi);
    final isFertile = ref.watch(detailVm.switchIsFertile);
    final isSubsidiya = ref.watch(detailVm.switchSubsidiya);
    final isTrellis = ref.watch(detailVm.switchTrellis);
    final isTrellisBeton = ref.watch(detailVm.switchTrellisBeton);
    final isTrellisTemir = ref.watch(detailVm.switchTrellisTemir);
    final isReservoirs = ref.watch(detailVm.switchReservoir);
    final isReservoirsBeton = ref.watch(detailVm.switchReservoirsBeton);
    final isReservoirsQoplamali = ref.watch(detailVm.switchReservoirsQoplamali);
    final isInvestmentXorijiy = ref.watch(detailVm.switchInvestmentXorjiy);
    final isInvestmentMahalliy = ref.watch(detailVm.switchInvestmentMahhalliy);

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final backgroundColor = theme.colorScheme.background;
    final sectionColor = isDark
        ? DesignColors.AppColors.darkSurface
        : DesignColors.AppColors.lightSurface;
    final outlineColor = isDark
        ? DesignColors.AppColors.darkOutline
        : DesignColors.AppColors.lightOutline;
    final shadowColor = isDark
        ? Colors.black.withOpacity(0.25)
        : Colors.black.withOpacity(0.08);

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: backgroundColor,
      appBar: const CustomAppBarWidget(
          title: "Ma`lumotlarni kiriting", canPop: true),
      body: SingleChildScrollView(
        padding: EdgeInsets.only(
          left: AppSpacing.screenPadding,
          right: AppSpacing.screenPadding,
          top: AppSpacing.screenPadding,
          bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.screenPadding,
        ),
        child: Container(
          decoration: BoxDecoration(
            color: sectionColor,
            borderRadius: BorderRadius.circular(AppRadius.card),
            border: Border.all(color: outlineColor),
            boxShadow: [
              BoxShadow(
                color: shadowColor,
                blurRadius: 32,
                spreadRadius: -12,
                offset: const Offset(0, 24),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MainText(text: "Bog`ning barpo etilgan vaqti"),
                CreatedTime(
                  selectedDate: detailVm.selectedDate,
                  setSelectedDate: (date) => detailVm.setSelectedDate(date),
                ),

                DropdownWithLabel(
                    label: "Plantatsiya turi",
                    items: plantatiopnType,
                    hint: "plantatsiya turi tanlanmagan",
                    selectedValue: detailVm.selectedPlantationType,
                    onChanged: (value) {
                      detailVm.setPlantationType(value);
                    }),
                if (detailVm.selectedPlantationType == 1)
                  DropdownWithLabel(
                    items: bogType,
                    hint: "bog' turi tanlanmagan",
                    selectedValue: detailVm.selectedBogType,
                    onChanged: (value) {
                      detailVm.setBogType(value);
                    },
                  ),
                if (detailVm.selectedPlantationType == 1 &&
                    detailVm.selectedBogType == 1)
                  DropdownWithLabel(
                    items: bogSubtype,
                    hint: "intensiv bog` turi tanlanmagan",
                    selectedValue: detailVm.selectedBogSubtype,
                    onChanged: (value) {
                      detailVm.setBogSubtype(value);
                    },
                  ),
                // 2 = Uzumzor, 3 = Issiqxona (per setup.dart)
                if (detailVm.selectedPlantationType == 3)
                  DropdownWithLabel(
                    hint: "issiqxona turi tanlanmagan",
                    items: issiqxonaType,
                    selectedValue: detailVm.selectedIssiqxonaType,
                    onChanged: (value) {
                      detailVm.setIssiqxonaType(value);
                    },
                  ),
                if (detailVm.selectedPlantationType == 2)
                  DropdownWithLabel(
                    hint: "uzumzor turi tanlanmagan",
                    items: uzumType,
                    selectedValue: detailVm.selectedUzumType,
                    onChanged: (value) {
                      detailVm.setUzumType(value);
                    },
                  ),
                DropdownWithLabel(
                  label: "Yer turi",
                  items: yerTuri,
                  hint: "yer turini tanlanmagan",
                  selectedValue: detailVm.selectedYerType,
                  onChanged: (value) {
                    detailVm.setYerType(value);
                  },
                ),
                SizedBox(height: 10.h),
                ProductivityIndicator(
                  value: detailVm.unumdorlikValue,
                  onChanged: detailVm.setUnumdorlikValue,
                ),
                CustomTextFieldWithLabel(
                  controller: detailVm.notUsableArea,
                  onTextChanged: (v) => detailVm.setNotUsableArea(
                    v.replaceAll('-', ''),
                  ),
                  hintText: "yaroqsiz maydon kiritilmagan",
                  label: "Foydalanishga yaroqsiz maydon: GA",
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))
                  ],
                ),
                CustomTextFieldWithLabel(
                  controller: detailVm.emptyArea,
                  onTextChanged: (v) => detailVm.setEmptyArea(
                    v.replaceAll('-', ''),
                  ),
                  hintText: "ochiq maydon kiritilmagan",
                  label: "Ochiq maydon: GA",
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))
                  ],
                ),
                SizedBox(height: 16.h),
                MainText(text: "Kontur raqamlari"),
                SizedBox(height: 10.h),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: detailVm.konturInputController,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(
                              RegExp(r'[0-9a-zA-Z]'))
                        ],
                        style: AppTypography.input(context).copyWith(
                          fontSize: 14.sp,
                          color: isDark
                              ? DesignColors.AppColors.darkOnBackground
                              : DesignColors.AppColors.lightOnBackground,
                        ),
                        decoration: InputDecoration(
                          hintText: "kontur raqamini kiriting",
                          filled: true,
                          fillColor: isDark
                              ? DesignColors.AppColors.darkSurfaceVariant
                              : sectionColor,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.inputPaddingHorizontal,
                            vertical: AppSpacing.inputPaddingVertical,
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppRadius.input),
                            borderSide: BorderSide(
                              color: outlineColor,
                              width: 1.2,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppRadius.input),
                            borderSide: BorderSide(
                              color: isDark
                                  ? DesignColors.AppColors.primary
                                  : theme.colorScheme.primary,
                              width: 1.6,
                            ),
                          ),
                          hintStyle: AppTypography.bodyMedium(context).copyWith(
                            fontSize: 14.sp,
                            color: isDark
                                ? DesignColors.AppColors.darkOnSurfaceVariant
                                : theme.colorScheme.onSurfaceVariant,
                          ),
                          isDense: true,
                        ),
                        onSubmitted: (_) => detailVm.addKonturNumber(),
                      ),
                    ),
                    SizedBox(width: 8.w),
                    SizedBox(
                      height: 40.h,
                      child: ElevatedButton(
                        onPressed: detailVm.addKonturNumber,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: DesignColors.AppColors.primary,
                          foregroundColor: Colors.white,
                          elevation: 4,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppRadius.input),
                          ),
                        ),
                        child: const Text("Qo'shish"),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: [
                    for (int i = 0; i < detailVm.konturNumbers.length; i++)
                      Chip(
                        label: Text(
                          detailVm.konturNumbers[i],
                          style: TextStyle(
                            color: isDark
                                ? DesignColors.AppColors.darkOnBackground
                                : DesignColors.AppColors.lightOnBackground,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        onDeleted: () => detailVm.removeKonturAt(i),
                        backgroundColor: isDark
                            ? DesignColors.AppColors.primaryContainerDark
                            : DesignColors.AppColors.primaryContainer,
                        side: BorderSide(
                          color: DesignColors.AppColors.primary.withOpacity(0.5),
                          width: 1.5,
                        ),
                        deleteIcon: Icon(
                          Icons.close,
                          size: 18,
                          color: isDark
                              ? DesignColors.AppColors.darkOnBackground
                              : DesignColors.AppColors.lightOnBackground,
                        ),
                      ),
                  ],
                ),
                SizedBox(height: 16.h),
                CustomSwitchCard(
                  label: "Xorijiy invitsitsiya",
                  switchValue: isInvestmentXorijiy,
                  onChanged: (value) {
                    ref.read(detailVm.switchInvestmentXorjiy.notifier).state =
                        value;
                    if (!value) {
                      detailVm.investmentXorijiyAmount.clear();
                      detailVm.setInvestmentXorijiyAmount("");
                    }
                  },
                  childWidgets: [
                    SizedBox(height: 10.h),
                    CustomTextFieldWithLabel(
                      controller: detailVm.investmentXorijiyAmount,
                      onTextChanged: detailVm.setInvestmentXorijiyAmount,
                      hintText: "Xorijiy invitsitsiya miqdori: \$",
                      keyboardType: TextInputType.number,
                      inputFormatters: [ThousandsSeparatorInputFormatter()],
                    ),
                  ],
                ),
                SizedBox(height: 10.h),
                CustomSwitchCard(
                  label: "Mahalliy invitsitsiya",
                  switchValue: isInvestmentMahalliy,
                  onChanged: (value) {
                    ref
                        .read(detailVm.switchInvestmentMahhalliy.notifier)
                        .state = value;
                    if (!value) {
                      detailVm.investmentMahhalliyAmount.clear();
                      detailVm.setInvestmentMahhalliyAmount("");
                    }
                  },
                  childWidgets: [
                    SizedBox(height: 10.h),
                    CustomTextFieldWithLabel(
                      controller: detailVm.investmentMahhalliyAmount,
                      onTextChanged: detailVm.setInvestmentMahhalliyAmount,
                      hintText: "Mahalliy invitsitsiya miqdori: so`m",
                      keyboardType: TextInputType.number,
                      inputFormatters: [ThousandsSeparatorInputFormatter()],
                    ),
                  ],
                ),
                SizedBox(height: 16.h),
                CustomSwitchCard(
                  label: "Tomchilab sug`oriladimi ?",
                  switchValue: isTomchi,
                  onChanged: (value) {
                    ref.read(detailVm.switchTomchi.notifier).state = value;
                    if (!value) {
                      detailVm.tomchiSystemsArea.clear();
                      detailVm.setTomchiSystemsArea("");
                      detailVm.tomchiSystemsCount.clear();
                      detailVm.setTomchiSystemsCount("");
                    }
                  },
                  childWidgets: [
                    BorderWidget(
                      children: [
                        Padding(
                          padding: REdgeInsets.only(top: 10),
                          child: CustomTextFieldWithLabel(
                            controller: detailVm.tomchiSystemsArea,
                            onTextChanged: detailVm.setTomchiSystemsArea,
                            hintText:
                                "Tomchilab sug‘oruladigan yer maydoni: GA",
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        Padding(
                          padding: REdgeInsets.only(top: 10),
                          child: CustomTextFieldWithLabel(
                            controller: detailVm.tomchiSystemsCount,
                            onTextChanged: detailVm.setTomchiSystemsCount,
                            hintText: "Tomchilab sug‘orish tizimlari soni",
                            keyboardType: TextInputType.number,
                          ),
                        )
                      ],
                    )
                  ],
                ),
                SizedBox(height: 16.h),
                CustomSwitchCard(
                  label: "Subsidiya ajratilganmi ?",
                  switchValue: isSubsidiya,
                  onChanged: (value) {
                    ref.read(detailVm.switchSubsidiya.notifier).state = value;
                  },
                  childWidgets: [
                    SubsidiyaButton(
                        viewModel: detailVm,
                        widget: AddSubsidiyaBottomShit(detailVm: detailVm)),
                    SizedBox(height: 10.h),
                    AddSubsidyList(
                      selectedList: detailVm.selectedSubsidy,
                      removeAt: (index) => detailVm.removeSubsidy(index),
                    ),
                  ],
                ),
                SizedBox(height: 16.h),
                CustomSwitchCard(
                  label: "Shpaller o`rnatilganmi ?",
                  switchValue: isTrellis,
                  onChanged: (value) {
                    ref.read(detailVm.switchTrellis.notifier).state = value;
                    if (!value) {
                      ref.read(detailVm.switchTrellisTemir.notifier).state =
                          false;
                      ref.read(detailVm.switchTrellisBeton.notifier).state =
                          false;
                      detailVm.trellisTemirInstalledArea.clear();
                      detailVm.setTrellisTemirInstalledArea("");
                      detailVm.trellisTemirCount.clear();
                      detailVm.setTrellisTemirCount("");
                      detailVm.trellisBetonInstalledArea.clear();
                      detailVm.setTrellisBetonInstalledArea("");
                      detailVm.trellisBetonCount.clear();
                      detailVm.setTrellisBetonCount("");
                    }
                  },
                  childWidgets: [
                    BorderWidget(
                      children: [
                        CustomSwitchCard(
                          label: "Temir shpaller",
                          switchValue: isTrellisTemir,
                          onChanged: (value) {
                            ref
                                .read(detailVm.switchTrellisTemir.notifier)
                                .state = value;
                          },
                          childWidgets: [
                            Padding(
                              padding: REdgeInsets.only(top: 10),
                              child: CustomTextFieldWithLabel(
                                controller: detailVm.trellisTemirInstalledArea,
                                onTextChanged:
                                    detailVm.setTrellisTemirInstalledArea,
                                hintText:
                                    "temir shpaller o'rnatilgan maydon: GA",
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            Padding(
                              padding: REdgeInsets.only(top: 10),
                              child: CustomTextFieldWithLabel(
                                controller: detailVm.trellisTemirCount,
                                onTextChanged: detailVm.setTrellisTemirCount,
                                hintText: "o'rnatilgan temir shpaller soni",
                                keyboardType: TextInputType.number,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 10.h),
                        CustomSwitchCard(
                          label: "Beton shpaller",
                          switchValue: isTrellisBeton,
                          onChanged: (value) {
                            ref
                                .read(detailVm.switchTrellisBeton.notifier)
                                .state = value;
                          },
                          childWidgets: [
                            Padding(
                              padding: REdgeInsets.only(top: 10),
                              child: CustomTextFieldWithLabel(
                                controller: detailVm.trellisBetonInstalledArea,
                                onTextChanged:
                                    detailVm.setTrellisBetonInstalledArea,
                                hintText:
                                    "beton shpaller o'rnatilgan maydon: GA ",
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            Padding(
                              padding: REdgeInsets.only(top: 10),
                              child: CustomTextFieldWithLabel(
                                controller: detailVm.trellisBetonCount,
                                onTextChanged: detailVm.setTrellisBetonCount,
                                hintText: "o'rnatilgan beton shpaller soni",
                                keyboardType: TextInputType.number,
                              ),
                            ),
                          ],
                        ),
                      ],
                    )
                  ],
                ),
                SizedBox(height: 16.h),
                CustomSwitchCard(
                  label: "Suv havzasi turi",
                  switchValue: isReservoirs,
                  onChanged: (value) {
                    ref.read(detailVm.switchReservoir.notifier).state = value;
                    if (!value) {
                      ref.read(detailVm.switchReservoirsBeton.notifier).state =
                          false;
                      ref
                          .read(detailVm.switchReservoirsQoplamali.notifier)
                          .state = false;
                      // Очищаем дополнительные контроллеры (кроме основных)
                      for (int i = detailVm.reservoirsBetonliVolumes.length - 1; i >= 0; i--) {
                        final controller = detailVm.reservoirsBetonliVolumes[i];
                        if (controller != detailVm.reservoirsBetonliVolume) {
                          controller.dispose();
                          detailVm.reservoirsBetonliVolumes.removeAt(i);
                        }
                      }
                      for (int i = detailVm.reservoirsQoplamaliVolumes.length - 1; i >= 0; i--) {
                        final controller = detailVm.reservoirsQoplamaliVolumes[i];
                        if (controller != detailVm.reservoirsQoplamaliVolume) {
                          controller.dispose();
                          detailVm.reservoirsQoplamaliVolumes.removeAt(i);
                        }
                      }
                      detailVm.reservoirsBetonliVolume.clear();
                      detailVm.setReservoirsBetonliVolume("");
                      detailVm.reservoirsQoplamaliVolume.clear();
                      detailVm.setReservoirQoplamaliVolume("");
                    }
                  },
                  childWidgets: [
                    BorderWidget(children: [
                      CustomSwitchCard(
                        label: "Betonli suv havzasi",
                        switchValue: isReservoirsBeton,
                        onChanged: (value) {
                          ref
                              .read(detailVm.switchReservoirsBeton.notifier)
                              .state = value;
                          if (value && detailVm.reservoirsBetonliVolumes.isEmpty) {
                            detailVm.initializeReservoirs();
                          }
                        },
                        childWidgets: [
                          if (isReservoirsBeton) ...[
                            ...List.generate(detailVm.reservoirsBetonliVolumes.length, (index) {
                              return Padding(
                                padding: REdgeInsets.only(top: index == 0 ? 10 : 16),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: CustomTextFieldWithLabel(
                                        controller: detailVm.reservoirsBetonliVolumes[index],
                                        onTextChanged: (_) {},
                                        hintText: "suv havzasi hajmi m³",
                                        keyboardType: TextInputType.number,
                                      ),
                                    ),
                                    if (detailVm.reservoirsBetonliVolumes.length > 1)
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, color: Colors.red),
                                        onPressed: () => detailVm.removeBetonReservoir(index),
                                      ),
                                  ],
                                ),
                              );
                            }),
                            Padding(
                              padding: REdgeInsets.only(top: 10),
                              child: TextButton.icon(
                                onPressed: detailVm.addBetonReservoir,
                                icon: const Icon(Icons.add),
                                label: const Text("Yana qo'shish"),
                              ),
                            ),
                          ],
                        ],
                      ),
                      SizedBox(height: 10.h),
                      CustomSwitchCard(
                        label: "Qoplamali suv havzasi",
                        switchValue: isReservoirsQoplamali,
                        onChanged: (value) {
                          ref
                              .read(detailVm.switchReservoirsQoplamali.notifier)
                              .state = value;
                          if (value && detailVm.reservoirsQoplamaliVolumes.isEmpty) {
                            detailVm.initializeReservoirs();
                          }
                        },
                        childWidgets: [
                          if (isReservoirsQoplamali) ...[
                            ...List.generate(detailVm.reservoirsQoplamaliVolumes.length, (index) {
                              return Padding(
                                padding: REdgeInsets.only(top: index == 0 ? 10 : 16),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: CustomTextFieldWithLabel(
                                        controller: detailVm.reservoirsQoplamaliVolumes[index],
                                        onTextChanged: (_) {},
                                        hintText: "suv havzasi hajmi m³",
                                        keyboardType: TextInputType.number,
                                      ),
                                    ),
                                    if (detailVm.reservoirsQoplamaliVolumes.length > 1)
                                      Padding(
                                        padding: REdgeInsets.only(left: 8),
                                        child: IconButton(
                                          icon: const Icon(Icons.delete_outline, color: Colors.red),
                                          onPressed: () => detailVm.removeQoplamaliReservoir(index),
                                        ),
                                      ),
                                  ],
                                ),
                              );
                            }),
                            Padding(
                              padding: REdgeInsets.only(top: 10),
                              child: TextButton.icon(
                                onPressed: detailVm.addQoplamaliReservoir,
                                icon: const Icon(Icons.add),
                                label: const Text("Yana qo'shish"),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ])
                  ],
                ),
                SizedBox(height: 16.h),
                CustomSwitchCard(
                  label: "Unumdormi ?",
                  switchValue: isFertile,
                  onChanged: (value) {
                    ref.read(detailVm.switchIsFertile.notifier).state = value;
                  },
                ),
                SizedBox(height: 16.h),
                FruitButton(),
                AddFruitArea(
                  selectedDetails: detailVm.selectedDetails,
                  removeDetailAt: (index) => detailVm.removeDetailAt(index),
                  selectedDetails2: detailVm.selectedFruitVerityRoot,
                ),
                MainText(text: "Bog`ning rasmlarini yuklang"),
                SizedBox(height: 8.h),
                // Photo requirements indicator
                Consumer(
                  builder: (context, ref, child) {
                    final requiredPhotos = detailVm.calculateMinimumPhotosRequired(ref);
                    final uploadedPhotos = [0, 1, 2, 3]
                        .where((i) => detailVm.getImageFile(i) != null)
                        .length;
                    final isComplete = uploadedPhotos >= requiredPhotos;
                    
                    return Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                      decoration: BoxDecoration(
                        color: isComplete
                            ? DesignColors.AppColors.success.withValues(alpha: 0.1)
                            : DesignColors.AppColors.warning.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isComplete
                              ? DesignColors.AppColors.success
                              : DesignColors.AppColors.warning,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isComplete ? Icons.check_circle : Icons.info_outline,
                            size: 20.sp,
                            color: isComplete
                                ? DesignColors.AppColors.success
                                : DesignColors.AppColors.warning,
                          ),
                          SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Text(
                              isComplete
                                  ? 'Barcha rasmlar yuklandi ($uploadedPhotos/$requiredPhotos)'
                                  : 'Kamida $requiredPhotos ta rasm yuklang ($uploadedPhotos/$requiredPhotos)',
                              style: TextStyle(
                                fontSize: 12.sp,
                                color: isComplete
                                    ? DesignColors.AppColors.success
                                    : DesignColors.AppColors.warning,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                SizedBox(height: 12.h),
                ImageUploadListWidget(
                  showImagePicker: detailVm.showImagePicker,
                  getImageFile: detailVm.getImageFile,
                ),
                SizedBox(height: 16.h),
                // Отображение общей площади после загрузки изображений
                Consumer(
                  builder: (context, ref, child) {
                    return Container(
                      padding: EdgeInsets.all(16.h),
                      decoration: BoxDecoration(
                        color: DesignColors.AppColors.primary,
                        borderRadius: BorderRadius.circular(12.r),
                        border: Border.all(
                          color: DesignColors.AppColors.primaryLight.withOpacity(0.5),
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: DesignColors.AppColors.primary.withOpacity(0.3),
                            blurRadius: 8,
                            spreadRadius: 0,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "Umumiy maydon:",
                            style: TextStyle(
                              fontSize: 15.sp,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            "${detailVm.getTotalArea(ref).toStringAsFixed(1)} GA",
                            style: TextStyle(
                              fontSize: 18.sp,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                  );
                },
              ),
              const SizedBox(height: AppSpacing.xxl),
              MainText(text: "Izohlar (ixtiyoriy)"),
              SizedBox(height: 10.h),
              TextField(
                controller: detailVm.commentsController,
                maxLines: 4,
                keyboardType: TextInputType.multiline,
                textInputAction: TextInputAction.newline,
                inputFormatters: [
                  // Разрешаем все Unicode символы, включая кириллицу, латиницу, цифры и знаки препинания
                  FilteringTextInputFormatter.allow(RegExp(r'[\s\S]')),
                ],
                style: AppTypography.input(context).copyWith(
                  fontSize: 14.sp,
                  color: isDark
                      ? DesignColors.AppColors.darkOnBackground
                      : DesignColors.AppColors.lightOnBackground,
                ),
                decoration: InputDecoration(
                  hintText: "Izoh kiriting (qo'shiladi yaratilgandan keyin)",
                  filled: true,
                  fillColor: isDark
                      ? DesignColors.AppColors.darkSurfaceVariant
                      : sectionColor,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.inputPaddingHorizontal,
                    vertical: AppSpacing.inputPaddingVertical,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.input),
                    borderSide: BorderSide(
                      color: outlineColor,
                      width: 1.2,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.input),
                    borderSide: BorderSide(
                      color: isDark
                          ? DesignColors.AppColors.primary
                          : theme.colorScheme.primary,
                      width: 1.6,
                    ),
                  ),
                  hintStyle: AppTypography.bodyMedium(context).copyWith(
                    fontSize: 14.sp,
                    color: isDark
                        ? DesignColors.AppColors.darkOnSurfaceVariant
                        : theme.colorScheme.onSurfaceVariant,
                  ),
                  isDense: true,
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: detailVm.postLoading
                        ? null
                        : () async {
                            String? validationMessage =
                                detailVm.validateFields(ref);
                            if (validationMessage == null) {
                              final responseServer = await detailVm.createPt(ref);
                              if (responseServer && context.mounted) {
                                Utils.fireTopSnackBar(detailVm.errorMessage ?? "",
                                    AppColors.c28A745, context);

                                // Обновляем список плантаций на главной странице перед переходом
                                try {
                                  // Получаем доступ к HomePageVm через provider
                                  final homeVM = ref.read(homePageVM);
                                  homeVM.getPlantationsModel(isLoadMore: false);
                                } catch (e) {
                                  // Если не удалось обновить, продолжаем без обновления
                                }

                                context.go('/');
                              } else {
                                if (context.mounted) {
                                  Utils.fireTopSnackBar(
                                      detailVm.errorMessage ?? "Xatolik yuz berdi",
                                      AppColors.cE60C0C,
                                      context);
                                }
                              }
                            } else {
                              Utils.fireTopSnackBar(
                                  validationMessage, AppColors.cE60C0C, context);
                            }
                          },
                    icon: detailVm.postLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Icon(Icons.upload_outlined, size: 20),
                    label: Text(
                      detailVm.postLoading
                          ? "Yuklanyapti..."
                          : "Ma'lumotlarni yuklash",
                    ),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.lg,
                      ),
                      backgroundColor: DesignColors.AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
