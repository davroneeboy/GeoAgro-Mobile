import 'package:agro_employee_public/src/core/widgets/custom_app_bar_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../data/model/notification/notification_models.dart';
import '../../../home/vm/notifications_vm.dart';
import '../../../../data/repository/app_repository_impl.dart';

final notificationsVM = ChangeNotifierProvider.autoDispose<NotificationsVm>((ref) {
  return NotificationsVm(AppRepositoryImpl());
});

class NatificationPage extends ConsumerStatefulWidget {
  const NatificationPage({super.key});

  @override
  ConsumerState<NatificationPage> createState() => _NatificationPageState();
}

class _NatificationPageState extends ConsumerState<NatificationPage> {
  late ScrollController _controller;

  @override
  void initState() {
    super.initState();
    _controller = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationsVM).refresh();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = ref.watch(notificationsVM);
    return Scaffold(
      appBar: CustomAppBarWidget(
        title: "Bildirishnomalar",
        canPop: true,
        actions: [
          if (vm.unreadCount > 0)
            TextButton(
              onPressed: () => ref.read(notificationsVM).markAllAsRead(),
              child: Text("Hammasini o'qilgan", style: TextStyle(fontSize: 12.sp)),
            ),
        ],
      ),
      body: vm.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => ref.read(notificationsVM).refresh(),
              child: vm.notifications.isEmpty
                  ? ListView(
                      children: [
                        SizedBox(height: 200.h),
                        Center(child: Text("Hozircha hechqanday bildirishnoma yo'q", style: TextStyle(fontSize: 16.sp))),
                      ],
                    )
                  : ListView.separated(
                      controller: _controller,
                      padding: REdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      itemBuilder: (context, index) {
                        if (index == vm.notifications.length) {
                          return Padding(
                            padding: REdgeInsets.symmetric(vertical: 16),
                            child: ElevatedButton(
                              onPressed: vm.isFetchingMore ? null : () => ref.read(notificationsVM).fetchMore(),
                              child: vm.isFetchingMore
                                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                                  : const Text("Yana yuklash"),
                            ),
                          );
                        }
                        final item = vm.notifications[index];
                        return _NotificationTile(
                          item: item,
                          onRead: () => ref.read(notificationsVM).markAsRead(item.id),
                          onDelete: () => ref.read(notificationsVM).delete(item.id),
                        );
                      },
                      separatorBuilder: (_, __) => 12.verticalSpace,
                      itemCount: vm.notifications.length + (vm.hasMore ? 1 : 0),
                    ),
            ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final NotificationItem item;
  final VoidCallback onRead;
  final VoidCallback onDelete;

  const _NotificationTile({required this.item, required this.onRead, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey("notif_${item.id}"),
      background: Container(color: Colors.redAccent),
      onDismissed: (_) => onDelete(),
      child: ListTile(
        leading: Icon(
          item.isRead ? Icons.notifications_none : Icons.notifications_active,
          color: item.isRead ? Colors.grey : Colors.orange,
        ),
        title: Text(item.title, style: TextStyle(fontWeight: item.isRead ? FontWeight.w400 : FontWeight.w600)),
        subtitle: Text(item.message),
        trailing: !item.isRead
            ? IconButton(icon: const Icon(Icons.mark_email_read_outlined), onPressed: onRead)
            : null,
      ),
    );
  }
}
