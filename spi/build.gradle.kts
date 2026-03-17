plugins {
    java
    id("com.github.johnrengelman.shadow")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

dependencies {
    compileOnly("org.keycloak:keycloak-core:26.0.0")
    compileOnly("org.keycloak:keycloak-server-spi:26.0.0")
    compileOnly("org.keycloak:keycloak-server-spi-private:26.0.0")
    compileOnly("org.keycloak:keycloak-services:26.0.0")
    compileOnly("org.keycloak:keycloak-model-jpa:26.0.0")
    compileOnly("org.keycloak:keycloak-model-infinispan:26.0.0")
    compileOnly("org.infinispan:infinispan-core:15.0.0.Final")
    compileOnly("io.micrometer:micrometer-core:1.14.0")
    compileOnly("jakarta.persistence:jakarta.persistence-api:3.1.0")
    compileOnly("org.projectlombok:lombok:1.18.32")
    annotationProcessor("org.projectlombok:lombok:1.18.32")

    implementation("com.google.guava:guava:33.0.0-jre")

    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
    testImplementation("org.testcontainers:keycloak:1.19.0")
}

tasks.test {
    useJUnitPlatform()
}

tasks.shadowJar {
    archiveClassifier.set("all")
    mergeServiceFiles()
    archiveBaseName.set("keycloak-api-keys")
}
