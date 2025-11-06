import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class GenericDropWidget<T> extends StatelessWidget {
  final String labelText;
  final List<T> items;
  final T? selectedItem;
  final bool isLoading;
  final Function(T?) onChanged;
  final String Function(T) itemLabel;

  const GenericDropWidget({
    super.key,
    required this.labelText,
    required this.items,
    required this.selectedItem,
    required this.isLoading,
    required this.onChanged,
    required this.itemLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(labelText, style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500)),
        Container(
          height: 50.h,
          width: MediaQuery.of(context).size.width * 0.3,
          padding: REdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8.r), border: Border.all(color: const Color(0x1E1E1E16))),
          child: Stack(
            alignment: Alignment.center,
            children: [
              DropdownButtonHideUnderline(
                child: DropdownButton<T>(
                  isExpanded: true,
                  value: selectedItem,
                  hint: Text("Tanlang:", style: TextStyle(color: Colors.grey, fontSize: 12.sp)),
                  items: items.map((T item) {
                    return DropdownMenuItem<T>(value: item, child: Text(itemLabel(item), style: TextStyle(fontSize: 14.sp)));
                  }).toList(),
                  onChanged: onChanged,
                ),
              ),
              if (isLoading) SizedBox(height: 10.h, width: 10.h, child: const CircularProgressIndicator(strokeWidth: 2)),
            ],
          ),
        ),
      ],
    );
  }
}
