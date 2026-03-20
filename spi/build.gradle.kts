plugins {
    java
    id("com.gradleup.shadow")
    id("com.vanniktech.maven.publish")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
    withSourcesJar()
    withJavadocJar()
}

val keycloakVersion = "26.5.2"
val testcontainersKeycloakVersion = "4.1.1"
val infinispanVersion = "15.2.0.Final"

dependencies {
    compileOnly("org.keycloak:keycloak-core:$keycloakVersion")
    compileOnly("org.keycloak:keycloak-server-spi:$keycloakVersion")
    compileOnly("org.keycloak:keycloak-server-spi-private:$keycloakVersion")
    compileOnly("org.keycloak:keycloak-services:$keycloakVersion")
    compileOnly("org.keycloak:keycloak-model-jpa:$keycloakVersion")
    compileOnly("org.keycloak:keycloak-model-infinispan:$keycloakVersion")
    compileOnly("org.infinispan:infinispan-core:$infinispanVersion")
    compileOnly("io.micrometer:micrometer-core:1.14.0")
    compileOnly("jakarta.persistence:jakarta.persistence-api:3.1.0")
    compileOnly("org.projectlombok:lombok:1.18.32")
    annotationProcessor("org.projectlombok:lombok:1.18.32")

    implementation("com.google.guava:guava:33.0.0-jre")

    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("org.mockito:mockito-core:5.11.0")
    testImplementation("org.keycloak:keycloak-core:$keycloakVersion")
    testImplementation("org.keycloak:keycloak-server-spi:$keycloakVersion")
    testImplementation("org.keycloak:keycloak-server-spi-private:$keycloakVersion")
    testImplementation("org.keycloak:keycloak-services:$keycloakVersion")
    testImplementation("org.keycloak:keycloak-model-jpa:$keycloakVersion")
    testImplementation("org.keycloak:keycloak-model-infinispan:$keycloakVersion")
    testImplementation("jakarta.persistence:jakarta.persistence-api:3.1.0")
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
    publishToMavenCentral(com.vanniktech.maven.publish.SonatypeHost.CENTRAL_PORTAL, automaticRelease = true)
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
