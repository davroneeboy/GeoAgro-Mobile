import "dart:async";
import "dart:developer";
import "package:flutter/foundation.dart";
import "package:flutter/services.dart";

import "setup.dart";
import "app.dart";
import "../setting/remote_controller.dart";

void run() {
  runZonedGuarded<void>(
    () async {
      await setup();
      await SystemChrome.setPreferredOrientations(
        [DeviceOrientation.portraitUp],
      );

      FlutterError.onError = (details) {
        log(
          "flutter_error: ${details.exception}",
          error: details.exception,
          stackTrace: details.stack,
        );
      };

      try {
        final RemoteController remoteController = RemoteController();
        await remoteController.initialize();
        App.run(remoteController);
      } catch (e) {
        log("Error initializing app: $e");
        App.run(RemoteController());
      }
    },
    (final error, final stackTrace) {
      log(
        "io_top_level_error: $error",
        error: error,
        stackTrace: stackTrace,
      );
    },
  );
}
