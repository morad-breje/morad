import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/app_colors.dart';
import '../models/material_item.dart';

// Same pattern used for passing data between pages: the widget class takes
// the value in its constructor and hands it straight to its State class.
class MaterialDetailsPage extends StatefulWidget {
  MaterialItem m;
  MaterialDetailsPage(this.m);

  @override
  State<MaterialDetailsPage> createState() => _MaterialDetailsPageState(m);
}

class _MaterialDetailsPageState extends State<MaterialDetailsPage> {
  MaterialItem mm;
  _MaterialDetailsPageState(this.mm);

  // picks an Icon based on the file's extension, same if/else-return idea
  // as the other pure helper functions in this app (e.g. sizeLabel).
  IconData fileIcon(String name) {
    String lower = name.toLowerCase();
    if (lower.endsWith(".pdf")) return Icons.picture_as_pdf;
    if (lower.endsWith(".doc") || lower.endsWith(".docx")) return Icons.description;
    if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return Icons.slideshow;
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return Icons.image;
    return Icons.insert_drive_file;
  }

  // opens the real Supabase Storage file URL in the browser/OS file handler
  // (same try/catch + SnackBar error style as the rest of the app); used for
  // both Download and Open preview since there's no in-app file viewer.
  void openFile() async {
    try {
      final uri = Uri.parse(mm.fileUrl);
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      appBar: AppBar(
        title: Text(mm.category, style: TextStyle(color: AppColors.ink)),
        centerTitle: true,
        backgroundColor: AppColors.paper,
        iconTheme: IconThemeData(color: AppColors.ink),
        // back arrow appears automatically because this page was pushed with Navigator.push
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            Text(
              mm.title,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.ink),
            ),
            SizedBox(height: 6),
            Text(
              "${mm.courseName} · ${mm.term ?? '-'}",
              style: TextStyle(fontSize: 13, color: AppColors.inkFaded),
            ),
            SizedBox(height: 16),
            // icon based on file type at the top, instead of a network image
            // (Supabase Storage image previews weren't loading reliably).
            Center(
              child: Icon(fileIcon(mm.fileName), size: 96, color: AppColors.primary),
            ),
            SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.paperField,
                border: Border.all(color: AppColors.border),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                children: [
                  Icon(fileIcon(mm.fileName), color: AppColors.ink),
                  SizedBox(width: 10),
                  Text(
                    "${mm.fileName}  (${sizeLabel(mm.fileSizeBytes)})",
                    style: TextStyle(fontSize: 13, color: AppColors.ink),
                  ),
                ],
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                openFile();
              },
              child: Text("Download"),
            ),
            SizedBox(height: 8),
            TextButton(
              onPressed: () {
                openFile();
              },
              child: Text("Open preview"),
            ),
            SizedBox(height: 16),
            Text(
              mm.uploaderName != null ? "Uploaded by: ${mm.uploaderName}" : "Uploaded by: course archive",
              style: TextStyle(fontSize: 13, color: AppColors.ink),
            ),
            Text("Uploaded on: ${mm.createdAt.substring(0, 10)}", style: TextStyle(fontSize: 13, color: AppColors.ink)),
            Text("Term: ${mm.term ?? '-'}", style: TextStyle(fontSize: 13, color: AppColors.ink)),
            SizedBox(height: 16),
            Text(
              "Description",
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.inkFaded),
            ),
            SizedBox(height: 6),
            Text(mm.description ?? "-", style: TextStyle(fontSize: 14, color: AppColors.ink)),
          ],
        ),
      ),
    );
  }
}
