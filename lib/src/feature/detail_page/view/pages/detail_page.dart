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

import '../../../../core/style/app_colors.dart';
import '../../../../core/utils/utils.dart';
import '../../../../core/widgets/custom_app_bar_widget.dart';
 
import '../../../../core/widgets/main_button.dart';
import '../../../../data/model/plantation/new_plantation_model.dart';
import '../../vm/detail_vm.dart';
import '../widgets/detail_dropdown_widget.dart';
import '../widgets/detail_text_fild_widget.dart';
import '../widgets/fruit_button.dart';
import '../widgets/images_upload_widget.dart';
import '../../../../core/utils/thousands_separator_input_formatter.dart';
import '../../../home/view/pages/home_page.dart';

class DetailPage extends ConsumerStatefulWidget {
  final Map<String, Object> model;
  const DetailPage({super.key, required this.model});

  @override
  DetailPageState createState() => DetailPageState();
}

class DetailPageState extends ConsumerState<DetailPage> {
  @override
  void didChangeDependencies() {
    ref.read(detailVM).setValue(
        id: widget.model["farmerId"] as int,
        coordinate: widget.model["coordinates"] as List<Coordinate>,
        polygonArea: widget.model["polygonArea"] as double?);
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

    return Scaffold(
      resizeToAvoidBottomInset: false,
      backgroundColor: AppColors.cF7F7F7,
      appBar: const CustomAppBarWidget(
          title: "Ma`lumotlarni kiriting", canPop: true),
      body: SingleChildScrollView(
        child: Padding(
          padding: REdgeInsets.symmetric(horizontal: 18, vertical: 16),
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
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))],
              ),
              CustomTextFieldWithLabel(
                controller: detailVm.emptyArea,
                onTextChanged: (v) => detailVm.setEmptyArea(
                  v.replaceAll('-', ''),
                ),
                hintText: "ochiq maydon kiritilmagan",
                label: "Ochiq maydon: GA",
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
                      controller: detailVm.konturInputController,
                      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9a-zA-Z]'))],
                      decoration: const InputDecoration(
                        hintText: "kontur raqamini kiriting",
                        border: OutlineInputBorder(),
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
                      child: const Text("Qo'shish"),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8.h),
              Wrap(
                spacing: 8.w,
                runSpacing: 8.h,
                children: [
                  for (int i = 0; i < detailVm.konturNumbers.length; i++)
                    Chip(
                      label: Text(detailVm.konturNumbers[i]),
                      onDeleted: () => detailVm.removeKonturAt(i),
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
                  ref.read(detailVm.switchInvestmentMahhalliy.notifier).state =
                      value;
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
                          hintText: "Tomchilab sug‘oruladigan yer maydoni: GA",
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
                    ref.read(detailVm.switchTrellisTemir.notifier).state = false;
                    ref.read(detailVm.switchTrellisBeton.notifier).state = false;
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
                          ref.read(detailVm.switchTrellisTemir.notifier).state =
                              value;
                        },
                        childWidgets: [
                          Padding(
                            padding: REdgeInsets.only(top: 10),
                            child: CustomTextFieldWithLabel(
                              controller: detailVm.trellisTemirInstalledArea,
                              onTextChanged:
                                  detailVm.setTrellisTemirInstalledArea,
                              hintText: "temir shpaller o'rnatilgan maydon: GA",
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
                          ref.read(detailVm.switchTrellisBeton.notifier).state =
                              value;
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
                    ref.read(detailVm.switchReservoirsBeton.notifier).state = false;
                    ref.read(detailVm.switchReservoirsQoplamali.notifier).state = false;
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
                      },
                      childWidgets: [
                        Padding(
                          padding: REdgeInsets.only(top: 10),
                          child: CustomTextFieldWithLabel(
                            controller: detailVm.reservoirsBetonliVolume,
                            onTextChanged: detailVm.setReservoirsBetonliVolume,
                            hintText: "suv havzasi hajmi m³",
                            keyboardType: TextInputType.number,
                          ),
                        ),
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
                      },
                      childWidgets: [
                        Padding(
                          padding: REdgeInsets.only(top: 10),
                          child: CustomTextFieldWithLabel(
                            controller: detailVm.reservoirsQoplamaliVolume,
                            onTextChanged: detailVm.setReservoirQoplamaliVolume,
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
              ImageUploadListWidget(
                pickImageFromCamera: detailVm.pickImageFromCamera,
                getImageFile: detailVm.getImageFile,
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
                          "${detailVm.getTotalArea(ref).toStringAsFixed(1)} GA",
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
                  text: "Malumotlarni yuklash",
                  isLoading: detailVm.postLoading,
                  onTap: () async {
                    // Защита от множественных нажатий
                    if (detailVm.postLoading) {
                      return;
                    }
                    
                    String? validationMessage = detailVm.validateFields(ref);
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
                  }),
            ],
          ),
        ),
      ),
    );
  }
}
