import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../widgets/app_material_context.dart";
import "../widgets/custom_screen_util.dart";
import "remote_controller.dart";

class App extends StatelessWidget {
  final RemoteController remoteController;

  const App({super.key, required this.remoteController});

  static void run(RemoteController remoteController) => runApp(ProviderScope(child: App(remoteController: remoteController)));

  @override
  Widget build(BuildContext context) => CustomScreenUtil(
        enabledPreview: false,
        child: AppMaterialContext(remoteController: remoteController),
      );
}
