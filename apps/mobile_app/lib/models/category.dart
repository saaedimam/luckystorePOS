class Category {
  final int categoryId;
  final String name;
  final String? iconUrl;
  final int? parentId;
  final List<Category> subcategories;

  const Category({
    required this.categoryId,
    required this.name,
    this.iconUrl,
    this.parentId,
    this.subcategories = const [],
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      categoryId: json['category_id'] as int,
      name: json['name'] as String,
      iconUrl: json['icon_url'] as String?,
      parentId: json['parent_id'] as int?,
      subcategories: (json['subcategories'] as List<dynamic>? ?? [])
          .map((c) => Category.fromJson(c as Map<String, dynamic>))
          .toList(),
    );
  }

  bool get isTopLevel => parentId == null;
}
