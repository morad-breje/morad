import 'package:flutter/material.dart';
import '../core/app_colors.dart';
import 'home_content.dart';
import 'upload_content.dart';
import 'profile_content.dart';

// This one Scaffold holds the AppBar + Drawer that stay on screen while
// we switch between Home / Upload / Profile. Switching pages is just an
// int (t) plus if statements picking which content to show, the same way
// we picked things to show inside build() before. Tapping a ListTile in
// the Drawer sets t and then Navigator.pop(context) closes the Drawer.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int t = 0; // 0 = Home, 1 = Upload, 2 = Profile

  @override
  Widget build(BuildContext context) {
    String title = "Home";
    if (t == 1) title = "Upload";
    if (t == 2) title = "Profile";

    Widget body = HomeContent();
    if (t == 1) body = UploadContent();
    if (t == 2) body = ProfileContent();

    return Scaffold(
      backgroundColor: AppColors.paper,
      appBar: AppBar(
        title: Text(title, style: TextStyle(color: AppColors.ink)),
        centerTitle: true,
        backgroundColor: AppColors.paper,
        iconTheme: IconThemeData(color: AppColors.ink),
      ),
      body: body,
      floatingActionButton: t == 0
          ? Container(
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(999),
              ),
              child: IconButton(
                onPressed: () {
                  setState(() {
                    t = 1;
                  });
                },
                icon: Icon(Icons.add, color: Colors.white),
              ),
            )
          : null,
      drawer: Drawer(
        backgroundColor: AppColors.paperField,
        child: ListView(
          children: [
            DrawerHeader(
              decoration: BoxDecoration(color: AppColors.primary),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.menu_book, color: Colors.white, size: 40),
                    SizedBox(height: 8),
                    Text(
                      "Malazem",
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),
            ListTile(
              leading: Icon(Icons.home, color: t == 0 ? AppColors.primary : AppColors.inkFaded),
              title: Text(
                "Home",
                style: TextStyle(color: t == 0 ? AppColors.primary : AppColors.ink),
              ),
              onTap: () {
                setState(() {
                  t = 0;
                });
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: Icon(Icons.upload_file, color: t == 1 ? AppColors.primary : AppColors.inkFaded),
              title: Text(
                "Upload",
                style: TextStyle(color: t == 1 ? AppColors.primary : AppColors.ink),
              ),
              onTap: () {
                setState(() {
                  t = 1;
                });
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: Icon(Icons.person, color: t == 2 ? AppColors.primary : AppColors.inkFaded),
              title: Text(
                "Profile",
                style: TextStyle(color: t == 2 ? AppColors.primary : AppColors.ink),
              ),
              onTap: () {
                setState(() {
                  t = 2;
                });
                Navigator.pop(context);
              },
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
              child: Text("SETTINGS", style: TextStyle(fontSize: 11, color: AppColors.inkFaded)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.dark_mode, color: AppColors.inkFaded),
                      SizedBox(width: 12),
                      Text("Dark mode", style: TextStyle(color: AppColors.ink)),
                    ],
                  ),
                  Switch(
                    value: AppColors.isDark,
                    onChanged: (v) {
                      setState(() {
                        AppColors.isDark = v;
                      });
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
