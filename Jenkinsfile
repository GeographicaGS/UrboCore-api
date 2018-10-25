#!/usr/bin/env groovy

// Global Environment variables
FAILURE_EMAIL = "build@geographica.gs"
DESIRED_REPOSITORY = "https://github.com/GeographicaGS/UrboCore-api.git"

pipeline{
  agent { node {
    label 'master'
  } }

  stages {
    stage('Preparing for build') {
      // agent{ docker{
      //     image 'debian'
      // } }
      agent { node {
        label 'master'
      } }
      steps {
        prepareBuild()
      }
    }

    stage ('Building') {
      agent { node {
        label 'docker'
      } }
      steps {
        sh "docker build --pull=true -f Dockerfile.new -t geographica/urbocore_api:${git_commit} ."
      }
    }

    stage ('Linter') {
      agent { node {
        label 'docker'
      } }
      steps {
        sh "docker run -i --rm --name urbocore_api--${build_name} -e 'NODE_ENV=development' geographica/urbocore_api:${git_commit} npm run lint"
      }
    }

    stage('Confirm deployment') {
      agent { node {
        label 'master'
      } }
      when { anyOf {
        branch 'master';
        branch 'staging';
        branch 'dev';
      } }
      steps {
        script {
          env.DEPLOY_TYPE = "ansible"
          if ( env.BRANCH_NAME == "master" ) {
            env.DEPLOY_TO = "production"
          } else {
            env.DEPLOY_TO = "${env.BRANCH_NAME}"
          }
        }

        // // Ask for confirmation
        // script {
        //   if ( env.DEPLOY_TO == "prod" ) {
        //     timeout(time:2, unit:'MINUTES') {
        //         // https://jenkins.io/doc/pipeline/steps/pipeline-input-step/
        //       input message: "Are you sure you want to deploy '${env.BRANCH_NAME}' of repository '${env.BUILD_URL}' to '${env.DEPLOY_URL}'?"
        //     }
        //   }
        // }
      }
    }

    stage ('Deploying') {
      agent { node {
        label 'docker'
      } }
      when { expression {
        env.DEPLOY_TYPE != null
      } }
      steps{
        script {
          echo "Deploy type: ${env.DEPLOY_TYPE}"
          echo "Deploy to: ${env.DEPLOY_TO}"

          // Rebuilding the image in order to set the API in production mode
          if (env.DEPLOY_TO == "production" ) {
            sh "docker build --pull=true --build-arg NODE_ENV=production -f Dockerfile.new -t geographica/urbocore_api:${git_commit} ."
          }

          withCredentials([[$class: 'UsernamePasswordMultiBinding',credentialsId: 'dockerhub',usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
            sh "docker login -u ${ USERNAME } -p ${ PASSWORD }"
            sh "docker tag geographica/urbocore_api:${ git_commit } geographica/urbocore_api:${ env.DEPLOY_TO }"
            sh "docker tag geographica/urbocore_api:${ git_commit } geographica/urbocore_api:${ env.DEPLOY_TO }-${ build_name }"
            sh "docker push geographica/urbocore_api:${ env.DEPLOY_TO }"
            sh "docker push geographica/urbocore_api:${ env.DEPLOY_TO }-${ build_name }"
          }

          if (env.DEPLOY_TYPE == "ansible") {
            sh "ansible urbo-${ env.DEPLOY_TO } -a 'sh /data/app/urbo/urbocore-api/deploy.sh'"
          } else {
            error("Unknown DEPLOY_TYPE: '${env.DEPLOY_TYPE}'")
          }
        }
      }
    }
  }

  post {
    always {
      deleteDir() /* clean up our workspace */
    }
    unstable {
      notifyStatus(currentBuild.currentResult)
    }
    failure {
      notifyStatus(currentBuild.currentResult)
    }
  }
}

def prepareBuild() {
  script {
    checkout scm

    sh "git rev-parse --short HEAD > .git/git_commit"
    sh "git --no-pager show -s --format='%ae' HEAD > .git/git_committer_email"

    workspace = pwd()
    branch_name = "${ env.BRANCH_NAME }".replaceAll("/", "_")
    git_commit = readFile(".git/git_commit").replaceAll("\n", "").replaceAll("\r", "")
    build_name = "${git_commit}"
    job_name = "${ env.JOB_NAME }".replaceAll("%2F", "/")
    committer_email = readFile(".git/git_committer_email").replaceAll("\n", "").replaceAll("\r", "")
    GIT_URL = sh(returnStdout: true, script: "git config --get remote.origin.url").trim()
    if ( GIT_URL != DESIRED_REPOSITORY ) {
      error("This jenkinsfile is configured for '${ DESIRED_REPOSITORY }' but it was executed from '${ GIT_URL }'.")
    }
  }
}

def notifyStatus(buildStatus) {
  def status
  def send_to

  try {
    switch (branch_name) {
      case 'master':
        send_to = "${ committer_email }, ${ FAILURE_EMAIL }"
        break
      default:
        send_to = "${ committer_email }"
        break
    }
  } catch(Exception ex) {
    send_to = "${ FAILURE_EMAIL }"
  }

  echo "Sending error email to: ${ send_to }"
  try {
    mail  to: "${ send_to }",
          from: "Jenkins Geographica <system@geographica.gs>",
          subject: "[${ buildStatus }]   ${currentBuild.fullDisplayName}",
          body: "Something is wrong in '${currentBuild.fullDisplayName}'. \n\nSee ${env.BUILD_URL} for more details."
  } catch(Exception ex) {
    echo "Something went wrong while sending an error email :("
  }
}
