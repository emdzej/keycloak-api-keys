import java.util.Base64

plugins {
    id("java-library")
    `maven-publish`
    signing
}

val springBootVersion = "4.0.3"

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-security:$springBootVersion")
    implementation("org.springframework.boot:spring-boot-starter-web:$springBootVersion")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.18.3")

    compileOnly("org.projectlombok:lombok:1.18.38")
    annotationProcessor("org.projectlombok:lombok:1.18.38")

    testImplementation("org.springframework.boot:spring-boot-starter-test:$springBootVersion")
    testImplementation("org.springframework.security:spring-security-test:6.5.0")
}

java {
    withSourcesJar()
    withJavadocJar()
}

publishing {
    publications {
        create<MavenPublication>("spring") {
            from(components["java"])
            groupId = "pl.emdzej.keycloak"
            artifactId = "keycloak-api-keys-spring"
            
            pom {
                name.set("Keycloak API Keys — Spring Boot")
                description.set("Spring Boot integration for Keycloak API key authentication")
                url.set("https://github.com/emdzej/keycloak-api-keys")
                
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
        maven {
            name = "MavenCentral"
            url = uri("https://central.sonatype.com/api/v1/publisher/deployments/download/")
            credentials {
                username = System.getenv("MAVEN_CENTRAL_USERNAME")
                password = System.getenv("MAVEN_CENTRAL_PASSWORD")
            }
        }
    }
}

signing {
    val signingKeyBase64 = System.getenv("GPG_PRIVATE_KEY")
    val signingPassword = System.getenv("GPG_PASSPHRASE")
    if (signingKeyBase64 != null && signingPassword != null) {
        val signingKey = String(Base64.getDecoder().decode(signingKeyBase64))
        useInMemoryPgpKeys(signingKey, signingPassword)
        sign(publishing.publications["spring"])
    }
}

tasks.withType<PublishToMavenRepository>().configureEach {
    dependsOn(tasks.withType<Sign>())
}
