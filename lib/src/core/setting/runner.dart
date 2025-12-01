// import "dart:async";
// import "package:flutter/services.dart";
// import "package:l/l.dart";

// import "setup.dart";
// import "app.dart";

// void run() => l.capture<void>(
//       () => runZonedGuarded<void>(
//         () async {
//           await setup();
//           await SystemChrome.setPreferredOrientations(
//             [DeviceOrientation.portraitUp],
//           ).then(
//             (_) => App.run(),
//           );
//         },
//         (final error, final stackTrace) {
//           l.e(
//             "io_top_level_error: $error\n $stackTrace",
//             stackTrace,
//           );
//         },
//       ),
//       const LogOptions(
//         printColors: true,
//         handlePrint: true,
//         outputInRelease: true,
//       ),
//     );

import "dart:async";
import "package:flutter/services.dart";
import "package:l/l.dart";

import "setup.dart";
import "app.dart";
import "../setting/remote_controller.dart"; // RemoteController ni import qiling

/// [Chat version]
void run() => l.capture<void>(
      () => runZonedGuarded<void>(
        () async {
          await setup();
          await SystemChrome.setPreferredOrientations(
            [DeviceOrientation.portraitUp],
          );

          try {
            // Remote Config ni yuklash
            final RemoteController remoteController = RemoteController();
            await remoteController.initialize(); // Remote Config ni yuklash

            // App ni ishga tushirish
            App.run(remoteController);
          } catch (e) {
            l.e("Error initializing app: $e");
            // Fallback to basic app initialization
            App.run(RemoteController());
          }
        },
        (final error, final stackTrace) {
          l.e(
            "io_top_level_error: $error\n $stackTrace",
            stackTrace,
          );
        },
      ),
      const LogOptions(
        printColors: true,
        handlePrint: true,
        outputInRelease: true,
      ),
    );
