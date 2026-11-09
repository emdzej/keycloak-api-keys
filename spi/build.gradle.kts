plugins {
    java
    id("com.gradleup.shadow")
    id("com.vanniktech.maven.publish")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

// Override with -PkeycloakVersion=999.0.0-SNAPSHOT to check against a locally built Keycloak (mvn install).
val keycloakVersion = providers.gradleProperty("keycloakVersion").getOrElse("26.8.2")
val testcontainersKeycloakVersion = "4.4.0"
val infinispanVersion = "16.0.15"

if (keycloakVersion.endsWith("-SNAPSHOT")) {
    repositories {
        mavenLocal()
    }
}

dependencies {
    compileOnly("org.keycloak:keycloak-core:$keycloakVersion")
    compileOnly("org.keycloak:keycloak-server-spi:$keycloakVersion")
    compileOnly("org.keycloak:keycloak-server-spi-private:$keycloakVersion")
    compileOnly("org.keycloak:keycloak-services:$keycloakVersion")
    compileOnly("org.keycloak:keycloak-model-jpa:$keycloakVersion")
    compileOnly("org.keycloak:keycloak-model-infinispan:$keycloakVersion")
    compileOnly("org.infinispan:infinispan-core:$infinispanVersion")
    compileOnly("io.micrometer:micrometer-core:1.17.1")
    compileOnly("jakarta.persistence:jakarta.persistence-api:3.2.0")
    compileOnly("org.projectlombok:lombok:1.18.48")
    annotationProcessor("org.projectlombok:lombok:1.18.48")

    testImplementation("org.junit.jupiter:junit-jupiter:6.1.3")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("org.mockito:mockito-core:5.24.0")
    testImplementation("org.keycloak:keycloak-core:$keycloakVersion")
    testImplementation("org.keycloak:keycloak-server-spi:$keycloakVersion")
    testImplementation("org.keycloak:keycloak-server-spi-private:$keycloakVersion")
    testImplementation("org.keycloak:keycloak-services:$keycloakVersion")
    testImplementation("org.keycloak:keycloak-model-jpa:$keycloakVersion")
    testImplementation("org.keycloak:keycloak-model-infinispan:$keycloakVersion")
    testImplementation("jakarta.persistence:jakarta.persistence-api:3.2.0")
    testImplementation("com.github.dasniko:testcontainers-keycloak:$testcontainersKeycloakVersion")
}

tasks.test {
    useJUnitPlatform()
}

tasks.shadowJar {
    archiveClassifier.set("all")
    archiveVersion.set("")
    mergeServiceFiles()
    archiveBaseName.set("keycloak-api-keys")
    exclude("META-INF/maven/**")
}

// Empty Javadoc JAR for SPI (no public API to document)
tasks.javadoc {
    options {
        (this as StandardJavadocDocletOptions).addStringOption("Xdoclint:none", "-quiet")
    }
}

mavenPublishing {
    publishToMavenCentral(automaticRelease = true)
    signAllPublications()

    coordinates("pl.emdzej.keycloak", "keycloak-api-keys-spi", version.toString())

    pom {
        name.set("Keycloak API Keys SPI")
        description.set("Keycloak SPI that adds API key authentication support")
        url.set("https://github.com/emdzej/keycloak-api-keys")
        inceptionYear.set("2026")

        licenses {
            license {
                name.set("Apache License, Version 2.0")
                url.set("https://www.apache.org/licenses/LICENSE-2.0")
            }
        }

        developers {
            developer {
                id.set("emdzej")
                name.set("Michał Jaskólski")
                email.set("michal@jaskolski.pro")
            }
        }

        scm {
            url.set("https://github.com/emdzej/keycloak-api-keys")
            connection.set("scm:git:git://github.com/emdzej/keycloak-api-keys.git")
            developerConnection.set("scm:git:ssh://git@github.com/emdzej/keycloak-api-keys.git")
        }
    }
}
