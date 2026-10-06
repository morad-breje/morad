import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/app_colors.dart';
import '../models/material_item.dart';
import 'login_page.dart';
import 'material_details_page.dart';

class ProfileContent extends StatefulWidget {
  const ProfileContent({super.key});

  @override
  State<ProfileContent> createState() => _ProfileContentState();
}

class _ProfileContentState extends State<ProfileContent> {
  final supa = Supabase.instance.client;
  List<MaterialItem> myMaterials = [];
  bool loading = true;
  String myName = "";
  bool editingName = false;
  TextEditingController nameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    load();
  }

  // same try/catch + SnackBar error handling style as the Home.dart
  // insert example from class: one select for this user's own profile row,
  // then one select for this user's own materials.
  void load() async {
    try {
      final user = supa.auth.currentUser;
      final profileData = await supa.from("profiles").select().eq("id", user!.id).single();
      final data = await supa
          .from("materials")
          .select("*, courses(name)")
          .eq("uploaded_by", user.id)
          .order("created_at");
      List<MaterialItem> r = [];
      for (int i = 0; i < data.length; i++) {
        r.add(MaterialItem.fromMap(data[i]));
      }
      setState(() {
        myName = profileData["full_name"];
        nameController.text = myName;
        myMaterials = r;
        loading = false;
      });
    } catch (e) {
      setState(() {
        loading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  // updates the "profiles" row for this user, same update() pattern taught
  // for Supabase, then reflects the new name locally with setState.
  void updateName() async {
    try {
      final user = supa.auth.currentUser;
      await supa.from("profiles").update({"full_name": nameController.text}).eq("id", user!.id);
      setState(() {
        myName = nameController.text;
        editingName = false;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  void signOut() async {
    await supa.auth.signOut();
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => LoginPage()),
      (route) => false,
    );
  }

  Widget statBox(String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
      decoration: BoxDecoration(
        color: AppColors.paperField,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.ink)),
          Text(label, style: TextStyle(fontSize: 11, color: AppColors.inkFaded)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Center(child: Text("Loading...", style: TextStyle(color: AppColors.inkFaded)));
    }

    final user = supa.auth.currentUser;
    String email = user?.email ?? "";

    // Set to count each course only once, same idea as the Set lesson.
    Set<String> courses = {};
    for (int i = 0; i < myMaterials.length; i++) courses.add(myMaterials[i].courseName);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: ListView(
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(999)),
                child: Center(
                  child: Text(
                    myName.isNotEmpty ? myName[0].toUpperCase() : "?",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
              SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(myName, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.ink)),
                      IconButton(
                        onPressed: () {
                          setState(() {
                            editingName = !editingName;
                          });
                        },
                        icon: Icon(editingName ? Icons.close : Icons.edit, size: 16, color: AppColors.inkFaded),
                      ),
                    ],
                  ),
                  Text(email, style: TextStyle(fontSize: 13, color: AppColors.inkFaded)),
                ],
              ),
            ],
          ),
          if (editingName) ...[
            SizedBox(height: 12),
            SizedBox(
              width: 300,
              child: TextField(
                controller: nameController,
                decoration: InputDecoration(border: OutlineInputBorder(), labelText: "Full name"),
              ),
            ),
            SizedBox(height: 8),
            TextButton(
              onPressed: () {
                updateName();
              },
              child: Text("Save name"),
            ),
          ],
          SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              statBox("${myMaterials.length}", "Uploads"),
              statBox("${courses.length}", "Courses"),
              statBox("2026", "Since"),
            ],
          ),
          SizedBox(height: 24),
          Text("My materials", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.ink)),
          SizedBox(height: 12),
          if (myMaterials.isEmpty) ...[
            Center(
              child: Column(
                children: [
                  Icon(Icons.insert_drive_file_outlined, size: 40, color: AppColors.inkFaded),
                  SizedBox(height: 8),
                  Text(
                    "You haven't uploaded anything yet.",
                    style: TextStyle(fontSize: 13, color: AppColors.inkFaded),
                  ),
                  Text(
                    "Tap Upload to add your first material.",
                    style: TextStyle(fontSize: 13, color: AppColors.inkFaded),
                  ),
                ],
              ),
            ),
          ],
          for (int i = 0; i < myMaterials.length; i++) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => MaterialDetailsPage(myMaterials[i])),
                  );
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.paperField,
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        myMaterials[i].title,
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.ink),
                      ),
                      SizedBox(height: 4),
                      Text(
                        "${myMaterials[i].courseName} · ${myMaterials[i].category}",
                        style: TextStyle(fontSize: 12, color: AppColors.inkFaded),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
          SizedBox(height: 18),
          ElevatedButton(
            onPressed: () {
              signOut();
            },
            child: Text("Log out"),
          ),
        ],
      ),
    );
  }
}
