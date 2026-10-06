import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/app_colors.dart';
import '../models/material_item.dart';
import 'material_details_page.dart';

class HomeContent extends StatefulWidget {
  const HomeContent({super.key});

  @override
  State<HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<HomeContent> {
  final supa = Supabase.instance.client;
  TextEditingController c1 = TextEditingController(); // search
  String selectedCourse = "All courses";
  String selectedTerm = "All terms";
  String selectedType = "All types";
  List<MaterialItem> allMaterials = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    load();
  }

  // fetches every material plus its course name and uploader name (joins,
  // same idea as the Map lesson but done by Supabase), same try/catch +
  // SnackBar error handling style as the Home.dart insert example from class.
  void load() async {
    try {
      final data = await supa
          .from("materials")
          .select("*, courses(name), profiles(full_name)")
          .order("created_at");
      List<MaterialItem> r = [];
      for (int i = 0; i < data.length; i++) {
        r.add(MaterialItem.fromMap(data[i]));
      }
      setState(() {
        allMaterials = r;
        loading = false;
      });
    } catch (e) {
      setState(() {
        loading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  // for loop building the filtered list, same idea as the even-numbers example
  List<MaterialItem> filtered() {
    List<MaterialItem> r = [];
    for (int i = 0; i < allMaterials.length; i++) {
      MaterialItem m = allMaterials[i];
      bool okCourse = selectedCourse == "All courses" || m.courseName == selectedCourse;
      bool okTerm = selectedTerm == "All terms" || m.term == selectedTerm;
      bool okType = selectedType == "All types" || m.category == selectedType;
      bool okQuery = c1.text == "" ||
          m.title.toLowerCase().contains(c1.text.toLowerCase()) ||
          m.courseName.toLowerCase().contains(c1.text.toLowerCase());
      if (okCourse && okTerm && okType && okQuery) r.add(m);
    }
    return r;
  }

  // one row of filter pills, reused for course / term / type
  // so we don't repeat the same block three times.
  Widget filterRow(List<String> options, String selected, void Function(String) onTap) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          for (int i = 0; i < options.length; i++) ...[
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: TextButton(
                onPressed: () {
                  onTap(options[i]);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: selected == options[i] ? AppColors.primary : AppColors.paperField,
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    options[i],
                    style: TextStyle(
                      fontSize: 12,
                      color: selected == options[i] ? Colors.white : AppColors.ink,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Center(child: Text("Loading...", style: TextStyle(color: AppColors.inkFaded)));
    }

    // filter chip options are built from whatever is actually in the
    // fetched materials, same Set-for-distinct-values idea as Profile's
    // course count.
    Set<String> courseSet = {};
    for (int i = 0; i < allMaterials.length; i++) courseSet.add(allMaterials[i].courseName);
    List<String> courseFilters = ["All courses"];
    for (String c in courseSet) courseFilters.add(c);

    Set<String> termSet = {};
    for (int i = 0; i < allMaterials.length; i++) {
      if (allMaterials[i].term != null) termSet.add(allMaterials[i].term!);
    }
    List<String> termFilters = ["All terms"];
    for (String s in termSet) termFilters.add(s);

    Set<String> typeSet = {};
    for (int i = 0; i < allMaterials.length; i++) typeSet.add(allMaterials[i].category);
    List<String> typeFilters = ["All types"];
    for (String t in typeSet) typeFilters.add(t);

    List<MaterialItem> list = filtered();
    // group materials by course instead of one long mixed list, same
    // .sort() technique from the List lesson, just compareTo-ing course
    // names so everything from the same course ends up next to each other.
    list.sort((a, b) => a.courseName.compareTo(b.courseName));

    return Padding(
      padding: const EdgeInsets.all(16),
      child: ListView(
        children: [
          TextField(
            controller: c1,
            onChanged: (v) {
              setState(() {});
            },
            decoration: InputDecoration(
              border: OutlineInputBorder(),
              prefix: Icon(Icons.search),
              labelText: "Search title, course",
            ),
          ),
          SizedBox(height: 12),
          Text("COURSE", style: TextStyle(fontSize: 11, color: AppColors.inkFaded)),
          filterRow(courseFilters, selectedCourse, (v) {
            setState(() {
              selectedCourse = v;
            });
          }),
          SizedBox(height: 8),
          Text("TERM", style: TextStyle(fontSize: 11, color: AppColors.inkFaded)),
          filterRow(termFilters, selectedTerm, (v) {
            setState(() {
              selectedTerm = v;
            });
          }),
          SizedBox(height: 8),
          Text("TYPE", style: TextStyle(fontSize: 11, color: AppColors.inkFaded)),
          filterRow(typeFilters, selectedType, (v) {
            setState(() {
              selectedType = v;
            });
          }),
          SizedBox(height: 8),
          Text("${list.length} results", style: TextStyle(fontSize: 12, color: AppColors.inkFaded)),
          SizedBox(height: 8),
          for (int i = 0; i < list.length; i++) ...[
            if (i == 0 || list[i].courseName != list[i - 1].courseName) ...[
              if (i != 0) SizedBox(height: 4),
              Text(
                list[i].courseName,
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
              SizedBox(height: 8),
            ],
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => MaterialDetailsPage(list[i])),
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
                        list[i].title,
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.ink),
                      ),
                      SizedBox(height: 4),
                      Text(
                        "Term ${list[i].term ?? '-'}",
                        style: TextStyle(fontSize: 12, color: AppColors.inkFaded),
                      ),
                      SizedBox(height: 6),
                      Text(list[i].description ?? "", style: TextStyle(fontSize: 13, color: AppColors.ink)),
                      SizedBox(height: 6),
                      Text(
                        "${list[i].category} · ${sizeLabel(list[i].fileSizeBytes)}",
                        style: TextStyle(fontSize: 11, color: AppColors.inkFaded),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
