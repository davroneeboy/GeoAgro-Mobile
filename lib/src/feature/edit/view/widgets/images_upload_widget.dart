import 'dart:io';
import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class EditImageUploadListWidget extends StatelessWidget {
  final Future<String?> Function(int) pickImageFromCamera;
  final Function(int) getImageFile;
  final List<String>? existingImages;
  final Future<String?> Function(int)? removeExistingImage;
  final bool Function(int)? isUploadingAt;

  const EditImageUploadListWidget({
    super.key,
    required this.pickImageFromCamera,
    required this.getImageFile,
    this.existingImages,
    this.removeExistingImage,
    this.isUploadingAt,
  });

  @override
  Widget build(BuildContext context) {
    // Общее количество слотов для изображений
    final totalSlots = 4;
    
    return SizedBox(
      height: 122.h,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: totalSlots,
        itemBuilder: (context, index) {
          File? uploadedImage = getImageFile(index);
          String? networkImage = (existingImages != null && existingImages!.length > index)
              ? existingImages![index]
              : null;

          return Padding(
            padding: REdgeInsets.only(right: 16.0, left: 2),
            child: MaterialButton(
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  builder: (context) {
                    return Padding(
                      padding: REdgeInsets.all(16.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (networkImage != null) ...[
                            ListTile(
                              leading: const Icon(Icons.delete, color: Colors.red),
                              title: const Text('O\'chirish'),
                              onTap: () async {
                                String? msg;
                                if (removeExistingImage != null) {
                                  msg = await removeExistingImage!(index);
                                }
                                if (context.mounted) {
                                  Navigator.pop(context);
                                  if (msg != null && msg.isNotEmpty) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(msg)),
                                    );
                                  }
                                }
                              },
                            ),
                            const Divider(),
                          ],
                          ListTile(
                            leading: const Icon(Icons.camera),
                            title: const Text('Camera'),
                            onTap: () async {
                              final message = await pickImageFromCamera(index);
                              if (context.mounted) {
                                Navigator.pop(context);
                                if (message != null && message.isNotEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(message)),
                                  );
                                }
                              }
                            },
                          ),
                        ],
                      ),
                    );
                  },
                );
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
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Base content (original styles)
                      if (uploadedImage != null)
                        Positioned.fill(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12.r),
                            child: Image.file(
                              uploadedImage,
                              fit: BoxFit.cover,
                            ),
                          ),
                        )
                      else if (networkImage != null)
                        Positioned.fill(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12.r),
                            child: Image.network(
                              networkImage,
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
                                  child: const Icon(
                                    Icons.error,
                                    color: Colors.red,
                                    size: 40,
                                  ),
                                );
                              },
                            ),
                          ),
                        )
                      else
                        Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
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
                          ),
                        ),
                      // Loader overlay
                      if (isUploadingAt?.call(index) == true)
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.black45,
                              borderRadius: BorderRadius.circular(12.r),
                            ),
                            child: const Center(
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
