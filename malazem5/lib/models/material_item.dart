// Plain class to hold one material's data, same idea as the Student/Person
// classes: fields + a constructor that fills them in, in order.
class MaterialItem {
  String id;
  String courseId;
  String courseName;
  String category; // "Notes" | "Summary" | "Exam" | other free-text category
  String? term;
  String? section;
  String title;
  String? description;
  String fileName;
  String filePath;
  String fileUrl;
  int fileSizeBytes;
  String? uploadedBy;
  String? uploaderName;
  String createdAt;

  MaterialItem(
    this.id,
    this.courseId,
    this.courseName,
    this.category,
    this.term,
    this.section,
    this.title,
    this.description,
    this.fileName,
    this.filePath,
    this.fileUrl,
    this.fileSizeBytes,
    this.uploadedBy,
    this.uploaderName,
    this.createdAt,
  );

  // builds a MaterialItem from the Map that Supabase returns for one row
  // (same idea as reading fields out of a Map like in the Map lesson),
  // using the nested "courses"/"profiles" Maps from the join to get the
  // course name and the uploader's name. "profiles" is null when the
  // material has no uploader (the seeded course-archive materials).
  factory MaterialItem.fromMap(Map<String, dynamic> map) {
    return MaterialItem(
      map["id"],
      map["course_id"],
      map["courses"]["name"],
      map["category"],
      map["term"],
      map["section"],
      map["title"],
      map["description"],
      map["file_name"],
      map["file_path"],
      map["file_url"],
      map["file_size_bytes"],
      map["uploaded_by"],
      map["profiles"] != null ? map["profiles"]["full_name"] : null,
      map["created_at"],
    );
  }
}

// bytes -> "5.1 MB" / "830 KB", same idea as the convert lesson.
String sizeLabel(int bytes) {
  double mb = bytes / (1024 * 1024);
  if (mb >= 1) return "${mb.toStringAsFixed(1)} MB";
  double kb = bytes / 1024;
  return "${kb.toStringAsFixed(0)} KB";
}
