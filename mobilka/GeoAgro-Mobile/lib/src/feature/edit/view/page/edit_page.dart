import 'package:agro_employee_public/src/core/widgets/custom_app_bar_widget.dart';
import 'package:agro_employee_public/src/core/widgets/main_button.dart';
import 'package:agro_employee_public/src/core/widgets/mian_text.dart';
import 'package:agro_employee_public/src/feature/detail_page/view/widgets/detail_dropdown_widget.dart';
import 'package:agro_employee_public/src/feature/edit/view/widgets/images_upload_widget.dart';
import 'package:agro_employee_public/src/feature/edit/view/widget/edit_subsidy_bottom_shit.dart';
import 'package:agro_employee_public/src/feature/edit/view/widget/edit_subsidy_list.dart';
import 'package:agro_employee_public/src/feature/edit/view/widget/updeta_create_time.dart';
import 'package:agro_employee_public/src/feature/edit/vm/edit_vm.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:lottie/lottie.dart';
import 'package:flutter/services.dart';
import '../../../../core/utils/thousands_separator_input_formatter.dart';
import '../../../../core/setting/setup.dart';
import '../../../../core/widgets/error_state_widget.dart';
import '../../../../core/utils/utils.dart';
import '../../../../core/style/app_colors.dart';
import '../../../../../design_system/theme/colors.dart' as DesignColors;
import '../../../../../design_system/theme/spacing.dart';
import '../../../../../design_system/theme/radius.dart';
import '../../../../../design_system/theme/typography.dart';
import '../../../detail_page/view/widgets/border_widget.dart';
import '../../../detail_page/view/widgets/detail_text_fild_widget.dart';
import '../../../detail_page/view/widgets/productivity_indicator_widget.dart';
import '../../../detail_page/view/widgets/subsidiya_button.dart';
import '../../../detail_page/view/widgets/switch_card_widget.dart';
import '../widget/edit_fruit_area.dart';
import '../widget/edit_fruit_button.dart';

class EditPage extends ConsumerStatefulWidget {
  final int id;
  const EditPage({super.key, required this.id});

  @override
  ConsumerState<EditPage> createState() => _EditPageState();
}

class _EditPageState extends ConsumerState<EditPage> {
  @override
  void initState() {
    super.initState();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(editVm).getPlantationDetail(ref, widget.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final edit = ref.watch(editVm);
    final isTomchi = ref.watch(switchTomchi);
    final isFertile = ref.watch(switchIsFertile);
    final isTrellis = ref.watch(switchTrellis);
    final isTrellisTemit = ref.watch(switchTrellisTemir);
    final isTrellisBeton = ref.watch(switchTrellisBeton);
    final isReservoirs = ref.watch(switchReservoirs);
    final isReservoirsBeton = ref.watch(switchReservoirsBeton);
    final isReservoirsQoplamali = ref.watch(switchReservoirsQoplamali);
    final isInvestmentXorijiy = ref.watch(switchInvestmentXorjiy);
    final isInvestmentMahhalliy = ref.watch(switchInvestmentMahhalliy);

    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    if (edit.isLoading) {
      return Scaffold(
        backgroundColor: DesignColors.AppColors.darkBackground,
        appBar: CustomAppBarWidget(
            title: "Malumotlar yuklanmoqda...", canPop: true),
        body: Center(
          child: Lottie.asset(
            'assets/lotties/search.json',
            width: 300.w,
            height: 300.h,
            fit: BoxFit.contain,
          ),
        ),
      );
    }
    if (edit.errorMessage != null) {
      return Scaffold(
        backgroundColor: DesignColors.AppColors.darkBackground,
        appBar: CustomAppBarWidget(title: "Xatolik !!!", canPop: true),
        body: ErrorStateWidget(
          errorMessage: edit.errorMessage ?? "Kutilmagan Javob qaytdi",
          onTap: () => edit.getPlantationDetail(ref, widget.id),
        ),
      );
    }

    return Scaffold(
      backgroundColor: DesignColors.AppColors.darkBackground,
      resizeToAvoidBottomInset: false,
      appBar: CustomAppBarWidget(title: "Tahrirlash", canPop: true),
      body: SingleChildScrollView(
        child: Padding(
          padding: REdgeInsets.symmetric(horizontal: 18, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              
              MainText(text: "Bog`ning barpo etilgan vaqti"),
              UpdetaCreateTime(
                serverDate: edit.plantationModel.gardenEstablishedYear != null
                    ? DateTime(
                        edit.plantationModel.gardenEstablishedYear!.toInt())
                    : null,
                setSelectedDate: (date) {
                  ref.read(editVm).setSelectedDate(date);
                },
              ),
              DropdownWithLabel(
                  label: "Plantatsiya turi",
                  items: plantatiopnType,
                  hint: "plantatsiya turi",
                  selectedValue: edit.selectedPlantationType,
                  onChanged: (value) {
                    edit.setPlantationType(value);
                  }),
              if (edit.selectedPlantationType == 1)
                DropdownWithLabel(
                  items: bogType,
                  hint: "bog' turi tanlanmagan",
                  selectedValue: edit.selectedBogType,
                  onChanged: (value) {
                    edit.setBogType(value);
                  },
                ),
              if (edit.selectedPlantationType == 1 && edit.selectedBogType == 1)
                DropdownWithLabel(
                  items: bogSubtype,
                  hint: "intensiv bog` turi tanlanmagan",
                  selectedValue: edit.selectedBogSubtype,
                  onChanged: (value) {
                    edit.setBogSubtype(value);
                  },
                ),
              // 2 = Uzumzor, 3 = Issiqxona (per setup.dart)
              if (edit.selectedPlantationType == 3)
                DropdownWithLabel(
                  hint: "issiqxona turi tanlanmagan",
                  items: issiqxonaType,
                  selectedValue: edit.selectedIssiqxonaType,
                  onChanged: (value) {
                    edit.setIssiqxonaType(value);
                  },
                ),
              if (edit.selectedPlantationType == 2)
                DropdownWithLabel(
                  hint: "uzumzor turi tanlanmagan",
                  items: uzumType,
                  selectedValue: edit.selectedUzumType,
                  onChanged: (value) {
                    edit.setUzumType(value);
                  },
                ),
              DropdownWithLabel(
                label: "Yer turi",
                hint: "yer turi tanlanmagan",
                
                items: yerTuri,
                selectedValue: edit.selectedYerTuri,
                onChanged: edit.setYerTuri,
              ),
              SizedBox(height: 10.h),
              ProductivityIndicator(
                value: edit.unumdorlikValue,
                onChanged: (newValue) {
                  edit.setUnumdorlikValue(newValue);
                },
              ),
              CustomTextFieldWithLabel(
                controller: edit.notUsableArea,
                onTextChanged: (v) =>
                    edit.setNotUsableArea(v.replaceAll('-', '')),
                hintText: "yaroqsiz maydon kiritilmagan",
                label: "Foydalanishga yaroqsiz maydon",
                keyboardType: TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))],
              ),
              CustomTextFieldWithLabel(
                controller: edit.emptyArea,
                onTextChanged: (v) =>
                    edit.setEmptyArea(v.replaceAll('-', '')),
                hintText: "ochiq maydon kiritilmagan",
                label: "Ochiq maydon",
                keyboardType: TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))],
              ),
              SizedBox(height: 16.h),
              MainText(text: "Kontur raqamlari"),
              SizedBox(height: 10.h),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: edit.konturInputController,
                      style: AppTypography.input(context).copyWith(fontSize: 14.sp),
                      decoration: InputDecoration(
                        hintText: "kontur raqamini kiriting",
                        filled: true,
                        fillColor: isDark
                            ? DesignColors.AppColors.darkSurfaceVariant
                            : colorScheme.surfaceVariant,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.inputPaddingHorizontal,
                          vertical: AppSpacing.inputPaddingVertical,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppRadius.input),
                          borderSide: BorderSide(
                            color: isDark
                                ? DesignColors.AppColors.darkOutline
                                : colorScheme.outline,
                            width: 1.2,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppRadius.input),
                          borderSide: BorderSide(
                            color: isDark
                                ? DesignColors.AppColors.primary
                                : colorScheme.primary,
                            width: 1.6,
                          ),
                        ),
                        hintStyle: AppTypography.bodyMedium(context).copyWith(
                          fontSize: 14.sp,
                            color: isDark
                              ? DesignColors.AppColors.darkOnSurfaceVariant
                              : colorScheme.onSurfaceVariant,
                        ),
                        isDense: true,
                      ),
                      onSubmitted: (_) => edit.addKonturNumber(),
                    ),
                  ),
                  SizedBox(width: 8),
                  SizedBox(
                    height: 40,
                    child: ElevatedButton(
                      onPressed: edit.addKonturNumber,
                      child: const Text("Qo'shish"),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (int i = 0; i < edit.konturNumbers.length; i++)
                    Chip(
                      label: Text(edit.konturNumbers[i]),
                      onDeleted: () => edit.removeKonturAt(i),
                    ),
                ],
              ),
              SizedBox(height: 16.h),
              CustomSwitchCard(
                label: "Xorijiy invitsitsiya",
                switchValue: isInvestmentXorijiy,
                onChanged: (value) {
                  ref.read(switchInvestmentXorjiy.notifier).state = value;
                  if (!value) {
                    edit.investmentXorijiyAmount.clear();
                    edit.setInvestmentXorijiyAmount("");
                  }
                },
                childWidgets: [
                  SizedBox(height: 10.h),
                  CustomTextFieldWithLabel(
                    controller: edit.investmentXorijiyAmount,
                    onTextChanged: edit.setInvestmentXorijiyAmount,
                    hintText: "Xorijiy invitsitsiya miqdori",
                    keyboardType: TextInputType.number,
                    inputFormatters: [ThousandsSeparatorInputFormatter()],
                  ),
                ],
              ),
              SizedBox(height: 10.h),
              CustomSwitchCard(
                label: "Mahalliy invitsitsiya",
                switchValue: isInvestmentMahhalliy,
                onChanged: (value) {
                  ref.read(switchInvestmentMahhalliy.notifier).state = value;
                  if (!value) {
                    edit.investmentMahhalliyAmount.clear();
                    edit.setInvestmentMahhalliyAmount("");
                  }
                },
                childWidgets: [
                  SizedBox(height: 10.h),
                  CustomTextFieldWithLabel(
                    controller: edit.investmentMahhalliyAmount,
                    onTextChanged: edit.setInvestmentMahhalliyAmount,
                    hintText: "Mahalliy invitsitsiya miqdori",
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
                  ref.read(switchTomchi.notifier).state = value;
                  if (!value) {
                    edit.irrigationAreaController.clear();
                    edit.setIrrigationArea("");
                    edit.irrigationSystemsCount.clear();
                    edit.setIrrigationSystemsCount("");
                  }
                },
                childWidgets: [
                  BorderWidget(
                    children: [
                      Padding(
                        padding: REdgeInsets.only(top: 10),
                        child: CustomTextFieldWithLabel(
                          controller: edit.irrigationAreaController,
                          onTextChanged: edit.setIrrigationArea,
                          hintText: "Tomchilab sug‘oruladigan yer maydoni",
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      Padding(
                        padding: REdgeInsets.only(top: 10),
                        child: CustomTextFieldWithLabel(
                          controller: edit.irrigationSystemsCount,
                          onTextChanged: edit.setIrrigationSystemsCount,
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
                switchValue: ref.watch(switchSubsidiya),
                onChanged: (value) {
                  ref.read(switchSubsidiya.notifier).state = value;
                },
                childWidgets: [
                  SubsidiyaButton(
                      viewModel: editVm,
                      widget: EditSubsidyBottomShit(viewModel: edit)),
                  SizedBox(height: 10.h),
                  EditSubsidyList(
                    selectedList: edit.selectedEditSubsidy,
                    removeAt: (index) => edit.removeSubsidy(index),
                  ),
                ],
              ),
              SizedBox(height: 16.h),
              CustomSwitchCard(
                label: "Shpaller o`rnatilganmi ?",
                switchValue: isTrellis,
                onChanged: (value) {
                  ref.read(switchTrellis.notifier).state = value;
                  if (!value) {
                    ref.read(switchTrellisTemir.notifier).state = false;
                    ref.read(switchTrellisBeton.notifier).state = false;
                    edit.trellisTemirInstalledArea.clear();
                    edit.setTrellisTemirInstalledArea("");
                    edit.trellisTemirCount.clear();
                    edit.setTrellisBetonCount("");
                    edit.trellisBetonInstalledArea.clear();
                    edit.setTrellisBetonInstalledArea("");
                    edit.trellisBetonCount.clear();
                    edit.setTrellisBetonCount("");
                  }
                },
                childWidgets: [
                  BorderWidget(
                    children: [
                      CustomSwitchCard(
                        label: "Temir shpaller",
                        switchValue: isTrellisTemit,
                        onChanged: (value) {
                          ref.read(switchTrellisTemir.notifier).state = value;
                        },
                        childWidgets: [
                          Padding(
                            padding: REdgeInsets.only(top: 10),
                            child: CustomTextFieldWithLabel(
                              controller: edit.trellisTemirInstalledArea,
                              onTextChanged: edit.setTrellisTemirInstalledArea,
                              hintText: "temir shpaller o'rnatilgan maydon",
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          Padding(
                            padding: REdgeInsets.only(top: 10),
                            child: CustomTextFieldWithLabel(
                              controller: edit.trellisTemirCount,
                              onTextChanged: edit.setTrellisBetonCount,
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
                          ref.read(switchTrellisBeton.notifier).state = value;
                        },
                        childWidgets: [
                          Padding(
                            padding: REdgeInsets.only(top: 10),
                            child: CustomTextFieldWithLabel(
                              controller: edit.trellisBetonInstalledArea,
                              onTextChanged: edit.setTrellisBetonInstalledArea,
                              hintText: "beton shpaller o'rnatilgan maydon",
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          Padding(
                            padding: REdgeInsets.only(top: 10),
                            child: CustomTextFieldWithLabel(
                              controller: edit.trellisBetonCount,
                              onTextChanged: edit.setTrellisBetonCount,
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
                label: "Unumdormi ?",
                switchValue: isFertile,
                onChanged: (value) {
                  ref.read(switchIsFertile.notifier).state = value;
                },
              ),
              SizedBox(height: 16.h),
              CustomSwitchCard(
                label: "Suv xavzasi turi ?",
                switchValue: isReservoirs,
                onChanged: (value) {
                  ref.read(switchReservoirs.notifier).state = value;
                  if (!value) {
                    ref.read(switchReservoirsBeton.notifier).state = false;
                    ref.read(switchReservoirsQoplamali.notifier).state = false;
                    edit.reservoirsBetonliVolume.clear();
                    edit.setReservoirBetonliVolume("");
                    edit.reservoirsQoplamaliVolume.clear();
                    edit.setReservoirQoplamaliVolume("");
                  }
                },
                childWidgets: [
                  BorderWidget(children: [
                    CustomSwitchCard(
                      label: "Betonli suv xavzasi",
                      switchValue: isReservoirsBeton,
                      onChanged: (value) {
                        ref.read(switchReservoirsBeton.notifier).state = value;
                      },
                      childWidgets: [
                        Padding(
                          padding: REdgeInsets.only(top: 10),
                          child: CustomTextFieldWithLabel(
                            controller: edit.reservoirsBetonliVolume,
                            onTextChanged: edit.setReservoirBetonliVolume,
                            hintText: "suv havzasi hajmi m³",
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 10.h),
                    CustomSwitchCard(
                      label: "Qoplamali suv xavzasi",
                      switchValue: isReservoirsQoplamali,
                      onChanged: (value) {
                        ref.read(switchReservoirsQoplamali.notifier).state =
                            value;
                      },
                      childWidgets: [
                        Padding(
                          padding: REdgeInsets.only(top: 10),
                          child: CustomTextFieldWithLabel(
                            controller: edit.reservoirsQoplamaliVolume,
                            onTextChanged: edit.setReservoirQoplamaliVolume,
                            hintText: "suv havzasi hajmi m³",
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                  ])
                ],
              ),
              SizedBox(height: 16.h),
              EditFruitButton(),
              EditFruitArea(
                selectedDetails: edit.selectedDetails,
                removeDetailAt: (index) => edit.removeDetailAt(index),
                editDetailAt: (index, ref, context) => edit.editDetailAt(index, ref, context),
              ),
              MainText(text: "Bog`ning rasmlarini qayta yuklang"),
              EditImageUploadListWidget(
                existingImages: edit.existingImages,
                showImagePicker: edit.showImagePicker,
                getImageFile: edit.getImageFile,
                removeExistingImage: edit.removeExistingImage,
                isUploadingAt: edit.isUploadingAt,
              ),
              SizedBox(height: 16.h),
              // Отображение общей площади после загрузки изображений
              Consumer(
                builder: (context, ref, child) {
                  return Container(
                    padding: EdgeInsets.all(12.h),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8.r),
                      border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "Umumiy maydon:",
                          style: TextStyle(
                            fontSize: 14.sp,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue[800],
                          ),
                        ),
                        Text(
                          "${edit.getTotalArea(ref).toStringAsFixed(1)} GA",
                          style: TextStyle(
                            fontSize: 16.sp,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue[800],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              SizedBox(height: 28.h),
              MainButton(
                text: "Yangilanishni yuklash",
                isLoading: edit.isSaving,
                onTap: () async {
                  // Защита от множественных нажатий
                  if (edit.isSaving) {
                    return;
                  }

                  final validation = edit.validateFields(ref);
                  if (validation != null) {
                    if (context.mounted) {
                      Utils.fireTopSnackBar(validation, AppColors.cE60C0C, context);
                    }
                    return;
                  }

                  var allTrue = await edit.saveAllChanges(ref, widget.id);
                  if (allTrue && context.mounted) {
                    Utils.fireTopSnackBar(
                        "Ma'lumotlar muvaffaqiyatli yangilandi",
                        AppColors.c28A745,
                        context);
                    context.go("/");
                  } else {
                    if (context.mounted && edit.errorMessage != null) {
                      Utils.fireTopSnackBar(
                          edit.errorMessage!,
                          AppColors.cE60C0C,
                          context);
                    }
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
