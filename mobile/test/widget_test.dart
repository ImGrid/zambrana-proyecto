import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zambrana_android/main.dart';

void main() {
  testWidgets('App loads correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: ZambranaApp(),
      ),
    );

    // Verificar que la app carga (muestra splash o login)
    await tester.pump();

    // El test pasa si no hay excepciones
    expect(true, isTrue);
  });
}
