plugins {
    id("com.github.johnrengelman.shadow") version "8.1.1" apply false
}

subprojects {
    group = "pl.emdzej.keycloak"
    version = "0.1.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }
}
