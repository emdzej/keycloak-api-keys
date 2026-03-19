plugins {
    id("java-library")
    id("maven-publish")
}

val springBootVersion = "4.0.3"

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-security:$springBootVersion")
    implementation("org.springframework.boot:spring-boot-starter-webflux:$springBootVersion")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.18.3")

    compileOnly("org.projectlombok:lombok:1.18.38")
    annotationProcessor("org.projectlombok:lombok:1.18.38")

    testImplementation("org.springframework.boot:spring-boot-starter-test:$springBootVersion")
    testImplementation("org.springframework.security:spring-security-test:6.5.0")
    testImplementation("io.projectreactor:reactor-test:3.7.5")
}
