plugins {
    id("java-library")
    id("maven-publish")
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-security:3.4.0")
    implementation("org.springframework.boot:spring-boot-starter-web:3.4.0")
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")

    compileOnly("org.projectlombok:lombok:1.18.30")
    annotationProcessor("org.projectlombok:lombok:1.18.30")

    testImplementation("org.springframework.boot:spring-boot-starter-test:3.4.0")
    testImplementation("org.springframework.security:spring-security-test:6.4.0")
}
