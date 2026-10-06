import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:file_picker/file_picker.dart';
import '../core/app_colors.dart';
import '../data/mock_materials.dart';

class UploadContent extends StatefulWidget {
  const UploadContent({super.key});

  @override
  State<UploadContent> createState() => _UploadContentState();
}

class _UploadContentState extends State<UploadContent> {
  final supa = Supabase.instance.client;
  final k = GlobalKey<FormState>();
  TextEditingController c1 = TextEditingController(); // title
  TextEditingController c2 = TextEditingController(); // description
  TextEditingController c3 = TextEditingController(); // term code, e.g. 20251
  List<Map<String, dynamic>> courses = [];
  String? selectedCourseId;
  String selectedType = "Notes";

  String? pickedFileName;
  Uint8List? pickedFileBytes;
  bool fileError = false;
  bool uploading = false;

  @override
  void initState() {
    super.initState();
    loadCourses();
  }

  // same try/catch + SnackBar error handling style as the Home.dart
  // insert example from class, just used for a select this time.
  void loadCourses() async {
    try {
      final data = await supa.from("courses").select().order("name");
      setState(() {
        courses = List<Map<String, dynamic>>.from(data);
        if (courses.isNotEmpty) selectedCourseId = courses[0]["id"];
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  // opens the device's real file picker (file_picker package -- not shown
  // in class, but there's no other way to grab a real file's bytes) and
  // saves the picked name + bytes, same try/catch style as the rest of the app.
  void pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(withData: true);
      if (result != null && result.files.isNotEmpty) {
        setState(() {
          pickedFileName = result.files.first.name;
          pickedFileBytes = result.files.first.bytes;
          fileError = false;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  // picks a content type from the file's extension, same if/else-return
  // idea as fileIcon() on the material details page.
  String contentTypeFor(String name) {
    String lower = name.toLowerCase();
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "application/msword";
    if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return "application/vnd.ms-powerpoint";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    return "application/octet-stream";
  }

  String? v1(String? s) {
    if (s != null && s.isNotEmpty)
      return null;
    else
      return "This field is required";
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

  // term codes are 5 digits: year + semester number, e.g. 20251 = first
  // semester of 2025 (matches the university's own numbering, not names
  // like Fall/Spring).
  String? v2(String? s) {
    if (s != null && s.length == 5 && isNumeric(s))
      return null;
    else
      return "5 digits, e.g. 20251";
  }

  // builds course dropdown items from whatever came back from Supabase,
  // same technique as the DropdownMenuItem-list function from class.
  List<DropdownMenuItem<String>> courseItems() {
    List<DropdownMenuItem<String>> items = [];
    for (int i = 0; i < courses.length; i++) {
      items.add(
        DropdownMenuItem(
          value: courses[i]["id"] as String,
          child: Text(courses[i]["name"]),
        ),
      );
    }
    return items;
  }

  // uploads the real picked bytes to Supabase Storage, then inserts the
  // material row pointing at that real file (same insert() pattern as
  // Home.dart, plus the storage upload from the Supabase docs).
  void upload() async {
    setState(() {
      uploading = true;
    });
    try {
      final user = supa.auth.currentUser;
      final storagePath = "uploads/${user!.id}/${DateTime.now().millisecondsSinceEpoch}_$pickedFileName";

      await supa.storage
          .from("materials")
          .uploadBinary(
            storagePath,
            pickedFileBytes!,
            fileOptions: FileOptions(contentType: contentTypeFor(pickedFileName!)),
          );

      final fileUrl = supa.storage.from("materials").getPublicUrl(storagePath);

      await supa.from("materials").insert({
        "course_id": selectedCourseId,
        "category": selectedType,
        "term": c3.text,
        "title": c1.text,
        "description": c2.text,
        "file_name": pickedFileName,
        "file_path": storagePath,
        "file_url": fileUrl,
        "file_size_bytes": pickedFileBytes!.length,
        "uploaded_by": user.id,
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Uploaded! You can find it on Home and your Profile.")),
      );
      c1.clear();
      c2.clear();
      c3.clear();
      setState(() {
        pickedFileName = null;
        pickedFileBytes = null;
        uploading = false;
      });
    } catch (e) {
      setState(() {
        uploading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: k,
        child: ListView(
          children: [
            Text(
              "Add study material",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.ink),
            ),
            SizedBox(height: 16),
            TextFormField(
              controller: c1,
              validator: v1,
              decoration: InputDecoration(border: OutlineInputBorder(), labelText: "Title"),
            ),
            SizedBox(height: 12),
            TextFormField(
              controller: c2,
              validator: v1,
              maxLines: 3,
              decoration: InputDecoration(border: OutlineInputBorder(), labelText: "Description"),
            ),
            SizedBox(height: 12),
            if (courses.isNotEmpty)
              DropdownButton(
                value: selectedCourseId,
                isExpanded: true,
                items: courseItems(),
                onChanged: (v) {
                  setState(() {
                    selectedCourseId = v!;
                  });
                },
              ),
            TextFormField(
              controller: c3,
              validator: v2,
              decoration: InputDecoration(
                border: OutlineInputBorder(),
                labelText: "Term",
                hintText: "e.g. 20251",
              ),
            ),
            SizedBox(height: 4),
            Text("Type", style: TextStyle(fontSize: 11, color: AppColors.inkFaded)),
            RadioGroup<String>(
              groupValue: selectedType,
              onChanged: (v) {
                setState(() {
                  selectedType = v!;
                });
              },
              child: Row(
                children: [
                  for (int i = 0; i < typeChoices.length; i++) ...[
                    Radio(value: typeChoices[i]),
                    Text(typeChoices[i]),
                    if (i < typeChoices.length - 1) SizedBox(width: 12),
                  ],
                ],
              ),
            ),
            SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                pickFile();
              },
              child: Text(pickedFileName == null ? "Choose file" : "File: $pickedFileName"),
            ),
            if (fileError) Text("Please choose a file", style: TextStyle(fontSize: 12, color: AppColors.rust)),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: uploading
                  ? null
                  : () {
                      setState(() {
                        fileError = pickedFileBytes == null;
                      });
                      if (k.currentState!.validate() && pickedFileBytes != null && selectedCourseId != null) {
                        upload();
                      }
                    },
              child: Text(uploading ? "Uploading..." : "Upload material"),
            ),
            SizedBox(height: 8),
            TextButton(
              onPressed: () {
                setState(() {
                  c1.clear();
                  c2.clear();
                  c3.clear();
                  pickedFileName = null;
                  pickedFileBytes = null;
                  fileError = false;
                });
              },
              child: Text("Cancel"),
            ),
          ],
        ),
      ),
    );
  }
}
