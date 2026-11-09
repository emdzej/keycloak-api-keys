plugins {
    id("pl.allegro.tech.build.axion-release") version "1.21.4"
    id("com.gradleup.shadow") version "9.6.1" apply false
    id("com.vanniktech.maven.publish") version "0.37.0" apply false
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
