import 'package:flutter/material.dart';

// Same colors as the mockup, just kept in one place so every screen
// matches (this is the same idea as using Colors.red etc, just our
// own named colors instead of the built-in ones).
// isDark flips every color to its dark-mode pair, same idea as the
// "controlling page using drawer" example where a bool picked between
// two Container colors -- just applied to the whole shared palette
// instead of one widget. The Switch in MainShell's Drawer sets isDark.
class AppColors {
  static bool isDark = false;

  static Color get paper => isDark ? const Color(0xFF0F172A) : const Color(0xFFF7FAFC);
  static Color get paperField => isDark ? const Color(0xFF1E293B) : const Color(0xFFFFFFFF);
  static Color get ink => isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A);
  static Color get inkFaded => isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
  static Color get border => isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1);
  static const Color primary = Color(0xFF0D9488);
  static const Color rust = Color(0xFFB0512E);
}
