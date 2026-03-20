plugins {
    id("java-library")
    id("com.vanniktech.maven.publish")
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
    withJavadocJar()
}

mavenPublishing {
    publishToMavenCentral(com.vanniktech.maven.publish.SonatypeHost.CENTRAL_PORTAL, automaticRelease = true)
    signAllPublications()

    coordinates("pl.emdzej.keycloak", "keycloak-api-keys-spring-webflux", version.toString())

    pom {
        name.set("Keycloak API Keys — Spring WebFlux")
        description.set("Spring WebFlux integration for Keycloak API key authentication")
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
