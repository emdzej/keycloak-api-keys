plugins {
    id("pl.allegro.tech.build.axion-release") version "1.21.1"
    id("com.github.johnrengelman.shadow") version "8.1.1" apply false
}

scmVersion {
    tag {
        prefix.set("v")
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
