import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/app_colors.dart';
import 'main_shell.dart';

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  final k = GlobalKey<FormState>();
  TextEditingController c1 = TextEditingController(); // full name
  TextEditingController c2 = TextEditingController(); // email
  TextEditingController c3 = TextEditingController(); // password
  final supa = Supabase.instance.client;

  // same shape as the SingUp() method in class; after the account is
  // created we insert a row in "profiles" (same insert() pattern as
  // Home.dart) so other students can see this student's name later.
  void signUp() async {
    try {
      final res = await supa.auth.signUp(email: c2.text, password: c3.text);
      await supa.from("profiles").insert({"id": res.user!.id, "full_name": c1.text});
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => MainShell()),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  String? v1(String? s) {
    if (s != null && s.isNotEmpty)
      return null;
    else
      return "Full name is required";
  }

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

  // student id emails: exactly 9 digits then @students.asu.edu.jo
  String? v2(String? s) {
    if (s != null &&
        s.length == 29 &&
        s.endsWith("@students.asu.edu.jo") &&
        isNumeric(s.substring(0, 9)))
      return null;
    else
      return "Must be 9 digits + @students.asu.edu.jo";
  }

  // 7 characters, must contain at least one letter and one digit
  // (toLowerCase/toUpperCase comparison is the same trick from the
  // String lesson, used here to tell a letter apart from a digit).
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

  String? v3(String? s) {
    if (s != null && s.length == 7 && hasLetterAndDigit(s))
      return null;
    else
      return "7 characters, letters and numbers";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      appBar: AppBar(
        title: Text("Create account", style: TextStyle(color: Colors.white)),
        centerTitle: true,
        backgroundColor: AppColors.primary,
        iconTheme: IconThemeData(color: Colors.white),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: k,
          child: ListView(
            children: [
              TextFormField(
                controller: c1,
                validator: v1,
                decoration: InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: "Full name",
                  prefix: Icon(Icons.person),
                ),
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: c2,
                validator: v2,
                decoration: InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: "University email",
                  hintText: "123456789@students.asu.edu.jo",
                  prefix: Icon(Icons.email),
                ),
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: c3,
                validator: v3,
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
                      signUp();
                    }
                  });
                },
                child: Text("Create account"),
              ),
              SizedBox(height: 12),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: Text("Already have an account? Log in"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
