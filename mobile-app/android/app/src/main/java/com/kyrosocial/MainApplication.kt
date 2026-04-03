package com.kyrosocial

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    // Work around startup crash on some RN 0.79 Android setups where
    // feature-flags JNI isn't packaged in debug artifacts.
    forceLocalFeatureFlagsAccessor()
  }

  private fun forceLocalFeatureFlagsAccessor() {
    try {
      val flagsClass =
          Class.forName("com.facebook.react.internal.featureflags.ReactNativeFeatureFlags")
      val localAccessorClass =
          Class.forName("com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsLocalAccessor")

      val localAccessor = localAccessorClass.getDeclaredConstructor().apply { isAccessible = true }.newInstance()
      val instance = flagsClass.getDeclaredField("INSTANCE").apply { isAccessible = true }.get(null)

      flagsClass.getDeclaredField("accessor").apply { isAccessible = true }.set(instance, localAccessor)
      val provider = object : kotlin.jvm.functions.Function0<Any> {
        override fun invoke(): Any = localAccessor
      }
      flagsClass.getDeclaredField("accessorProvider").apply { isAccessible = true }.set(instance, provider)
    } catch (_: Throwable) {
      // If reflection fails, we'll keep default behavior.
    }
  }
}
