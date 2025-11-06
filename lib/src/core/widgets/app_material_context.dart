import "package:flutter_riverpod/flutter_riverpod.dart";

import "../routes/router_config.dart";
import "package:flutter/material.dart";

import "../style/app_colors.dart";
import "../setting/remote_controller.dart";
import "../setting/interited_remote_notifair.dart";
class AppMaterialContext extends ConsumerWidget {
  final RemoteController remoteController;

  const AppMaterialContext({super.key, required this.remoteController});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return InheritedRemoteNotifier(
      remoteController: remoteController,
      child: Builder(
        builder: (context) {
          final isBlocked = InheritedRemoteNotifier.of(context).isBlocked;

          return MaterialApp.router(
            debugShowCheckedModeBanner: false,
            routerConfig: isBlocked ? RouterConfigService.blocRouter : RouterConfigService.router,
            theme: ThemeData(
              scaffoldBackgroundColor: AppColors.cF7F7F7,
            ),
          );
        },
      ),
    );
  }
}
