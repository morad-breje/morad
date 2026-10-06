import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/login_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: "https://ladxjknevwgdltwhqpab.supabase.co",
    publishableKey: "sb_publishable_F5hSEJ1TZeqRYF2JexMeyA_YS2FAJ2o",
  );

  runApp(MaterialApp(home: LoginPage(), debugShowCheckedModeBanner: false));
}
