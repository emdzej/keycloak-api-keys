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

java {
    withSourcesJar()
}

publishing {
    publications {
        create<MavenPublication>("springWebflux") {
            from(components["java"])
            artifactId = "keycloak-api-keys-spring-webflux"
            pom {
                name.set("Keycloak API Keys — Spring WebFlux")
                description.set("Spring WebFlux integration for Keycloak API key authentication")
                url.set("https://github.com/emdzej/keycloak-api-keys")
                licenses {
                    license {
                        name.set("MIT License")
                        url.set("https://opensource.org/licenses/MIT")
                    }
                }
            }
        }
    }
    repositories {
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/emdzej/keycloak-api-keys")
            credentials {
                username = System.getenv("GITHUB_ACTOR")
                password = System.getenv("GITHUB_TOKEN")
            }
        }
    }
}
