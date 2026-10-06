import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/app_colors.dart';
import 'signup_page.dart';
import 'main_shell.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final k = GlobalKey<FormState>();
  TextEditingController c1 = TextEditingController(); // email
  TextEditingController c2 = TextEditingController(); // password
  final supa = Supabase.instance.client;

  // same idea as the try/catch around the Supabase insert in Home.dart,
  // just used here to check "is this whole string digits" without regex.
  bool isNumeric(String s) {
    try {
      int.parse(s);
      return true;
    } catch (e) {
      return false;
    }
  }

  // validator functions: return null if valid, or the error message string.
  // student id emails: exactly 9 digits then @students.asu.edu.jo
  String? v1(String? s) {
    if (s != null &&
        s.length == 29 &&
        s.endsWith("@students.asu.edu.jo") &&
        isNumeric(s.substring(0, 9)))
      return null;
    else
      return "Must be 9 digits + @students.asu.edu.jo";
  }

  // 7 characters, must contain at least one letter and one digit
  bool hasLetterAndDigit(String s) {
    bool letter = false;
    bool digit = false;
    for (int i = 0; i < s.length; i++) {
      String c = s[i];
      if (isNumeric(c)) digit = true;
      if (c.toLowerCase() != c.toUpperCase()) letter = true;
    }
    return letter && digit;
  }

  String? v2(String? s) {
    if (s != null && s.length == 7 && hasLetterAndDigit(s))
      return null;
    else
      return "7 characters, letters and numbers";
  }

  // same shape as the SingIn() method in class: call signInWithPassword,
  // check s.user, and try/catch around it like the Home.dart insert example.
  void signIn() async {
    try {
      final s = await supa.auth.signInWithPassword(email: c1.text, password: c2.text);
      if (s.user != null) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => MainShell()),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      // no AppBar here -- the colored banner below is the header instead,
      // same idea as the DrawerHeader banner, just at the top of the page.
      body: ListView(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(24, 64, 24, 32),
            color: AppColors.primary,
            child: Column(
              children: [
                Icon(Icons.school, size: 56, color: Colors.white),
                SizedBox(height: 12),
                Text(
                  "Malazem",
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: k,
              child: Column(
                children: [
                  Text(
                    "Sign in with your university email",
                    style: TextStyle(fontSize: 14, color: AppColors.inkFaded),
                  ),
                  SizedBox(height: 20),
                  TextFormField(
                    controller: c1,
                    validator: v1,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(),
                      labelText: "University email",
                      hintText: "123456789@students.asu.edu.jo",
                      prefix: Icon(Icons.email),
                    ),
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: c2,
                    validator: v2,
                    obscureText: true,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(),
                      labelText: "Password",
                      prefix: Icon(Icons.lock),
                    ),
                  ),
                  SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        if (k.currentState!.validate()) {
                          signIn();
                        }
                      });
                    },
                    child: Text("Log in"),
                  ),
                  SizedBox(height: 12),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => SignupPage()),
                      );
                    },
                    child: Text("New here? Create an account"),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
