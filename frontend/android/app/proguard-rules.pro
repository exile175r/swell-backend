# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# React Native Reanimated (General)
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# React Native Screens / Navigation
-keep class com.swmansion.rnscreens.** { *; }
-keep class androidx.appcompat.widget.** { *; }
-keep class androidx.coordinatorlayout.** { *; }
-keep class androidx.core.** { *; }

# Expo and basic React Native bindings
-keep class expo.modules.** { *; }
-keep class com.facebook.react.** { *; }

# NativeWind / Tailwind (Just in case, though usually CSS based, sometimes native view extensions are used)
-keep class com.nativewind.** { *; }

# Prevent shrinking of fundamental Android UI components that RN uses
-keep class android.view.** { *; }
-keep class android.widget.** { *; }
