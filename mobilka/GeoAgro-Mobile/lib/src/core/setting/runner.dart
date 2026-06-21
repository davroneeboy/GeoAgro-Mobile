import "dart:async";
import "dart:developer";
import "package:flutter/foundation.dart";
import "package:flutter/services.dart";
import "package:firebase_crashlytics/firebase_crashlytics.dart";

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
        FirebaseCrashlytics.instance.recordFlutterFatalError(details);
      };

      PlatformDispatcher.instance.onError = (error, stack) {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
        return true;
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
      FirebaseCrashlytics.instance.recordError(error, stackTrace, fatal: true);
    },
  );
}
