import 'dart:io';
import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class ImageUploadListWidget extends StatelessWidget {
  final Function(BuildContext, int) showImagePicker; // Обновлено: принимает context
  final Function(int) getImageFile;
  final List<String>? images;

  const ImageUploadListWidget({
    super.key,
    required this.showImagePicker,
    required this.getImageFile,
    this.images,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 122.h,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 4,
        itemBuilder: (context, index) {
          File? uploadedImage = getImageFile(index);
          String? networkImage = (images != null && images!.length > index)
              ? images![index]
              : null;

          return Padding(
            padding: REdgeInsets.only(right: 16.0, left: 2),
            child: MaterialButton(
              onPressed: () {
                // Используем новый метод showImagePicker из VM
                showImagePicker(context, index);
              },
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
              padding: EdgeInsets.zero,
              child: DottedBorder(
                borderType: BorderType.RRect,
                radius: Radius.circular(12.r),
                color: Colors.grey,
                strokeWidth: 2,
                dashPattern: const [8, 4],
                child: Container(
                  width: 160.w,
                  height: 120.h,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: uploadedImage != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(12.r),
                          child: Image.file(
                            uploadedImage,
                            fit: BoxFit.cover,
                          ),
                        )
                      : (networkImage != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(12.r),
                              child: Image.network(
                                networkImage,
                                fit: BoxFit.fill,
                                loadingBuilder:
                                    (context, child, loadingProgress) {
                                  if (loadingProgress == null) {
                                    return child;
                                  } else {
                                    return Center(
                                      child: CircularProgressIndicator(color: Colors.blue,),
                                    );
                                  }
                                },
                                errorBuilder: (context, error, stackTrace) {
                                  return Center(
                                    child: Icon(Icons.broken_image),
                                  );
                                },
                              ),
                            )
                          : Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.add_a_photo_outlined,
                                  color: Colors.grey,
                                ),
                                SizedBox(height: 8.h),
                                Text(
                                  'Rasm yuklang ${index + 1}',
                                  style: TextStyle(
                                    color: Colors.grey,
                                    fontSize: 12.sp,
                                  ),
                                ),
                              ],
                            )),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
