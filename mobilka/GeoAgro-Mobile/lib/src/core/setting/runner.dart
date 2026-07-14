import "dart:async";
import "dart:developer";
import "dart:io";
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
        // google_maps_flutter иногда зовёт hideInfoWindow на markerId,
        // который уже удалён из Set<Marker> (гонка между пересборкой
        // маркеров и открытым InfoWindow) — это баг самого плагина, не
        // нашего кода, и не должен считаться fatal-крашем приложения:
        // репортим как non-fatal, чтобы не терять сигнал в Crashlytics,
        // но не портить crash-free rate ошибкой, которую нельзя починить
        // на нашей стороне без апстрим-фикса плагина.
        final isBenignMapsInfoWindowError =
            details.exception is PlatformException &&
                (details.exception as PlatformException).code ==
                    'Invalid markerId' &&
                (details.exception as PlatformException)
                        .message
                        ?.contains('hideInfoWindow') ==
                    true;
        log(
          "flutter_error: ${details.exception}",
          error: details.exception,
          stackTrace: details.stack,
        );
        if (isBenignMapsInfoWindowError) {
          FirebaseCrashlytics.instance.recordError(
            details.exception,
            details.stack,
            fatal: false,
          );
        } else {
          FirebaseCrashlytics.instance.recordFlutterFatalError(details);
        }
      };

      PlatformDispatcher.instance.onError = (error, stack) {
        // Image.network стримит байты картинки асинхронно — обрыв сети
        // посреди загрузки (HttpException из isolate message handling)
        // не всегда долетает до errorBuilder виджета и всплывает здесь.
        // Это ожидаемое сетевое событие (плохое покрытие/переключение
        // сети во время просмотра фото плантации), не баг приложения —
        // не должно считаться fatal-крашем.
        final isBenignNetworkImageError = error is HttpException &&
            error.message.contains('Connection closed while receiving data');
        FirebaseCrashlytics.instance.recordError(
          error,
          stack,
          fatal: !isBenignNetworkImageError,
        );
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
