plugins {
    java
    id("com.gradleup.shadow")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
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
}
