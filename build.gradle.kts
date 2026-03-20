plugins {
    id("pl.allegro.tech.build.axion-release") version "1.21.1"
    id("com.gradleup.shadow") version "9.0.0-beta12" apply false
    id("com.vanniktech.maven.publish") version "0.32.0" apply false
}

scmVersion {
    tag {
        prefix.set("")
        versionSeparator.set("")
    }
    versionIncrementer("incrementMinor")
}

val scmVersionValue = scmVersion.version

allprojects {
    group = "pl.emdzej.keycloak"
    version = scmVersionValue
}

subprojects {
    repositories {
        mavenCentral()
    }
}
