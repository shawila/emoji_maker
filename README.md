# Emoji maker
This is a simple NodeJS API where the user can upload an image, and it will be transformed into a 100x100 thumbnail.
The user can then call another API to receive said thumbnail.

# Run locally
Build the docker image.
```
docker build -t emoji_maker .
```
Run the docker container.
```
docker run --publish 3000:8090 emoji_maker
```
Then you can upload an image with
```
curl -X POST -F "image=@/PATH_TO_IMAGE/image.png" https://localhost:8090/upload
```
The API response should be something like
```
{
  "message": "File upload in progress",
  "jobId": "ab5d20fb-8004-4991-b9c4-962500f1d51d"
}
```
The job ID can then be used to get the image using the endpoint `/images/JOB_ID`.
A list of all jobs can be found using the endpoint `/jobs` with sample response
```
[
    {
        "job_id": "ab5d20fb-8004-4991-b9c4-962500f1d51d",
        "status": "uploading"
    },
    {
        "job_id": "d0311f23-028c-4e83-8c5b-705a74198409",
        "status": "done"
    }
]
```

# Deploying
We can use helm to deploy the application.
```
helm install nodeserver ./chart/nodeserver
```
We can confirm the installation
```
helm list --all
```
The output should look like
```
NAME            NAMESPACE       REVISION        UPDATED                                 STATUS          CHART                   APP VERSION
deploy          default         6               2024-03-19 09:55:04.828079266 +0900 JST deployed        assignment-0.1.0        1.16.0
nodeserver      default         1               2024-03-20 02:00:19.961919588 +0900 JST deployed        nodeserver-1.0.0
```
We can get the list of available services
```
kubectl get services
```
Our service should show in this table
```
NAME                 TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
kubernetes           ClusterIP   10.96.0.1        <none>        443/TCP          17h
nodeserver-service   NodePort    10.104.172.91    <none>        3000:31139/TCP   8m
```
We can then run a similar command depending on where we deployed our kubernetes cluster
```
minikube service nodeserver-service
```
And the service we can connect to should be seen in the output
```
|-----------|--------------------|-------------|---------------------------|
| NAMESPACE |        NAME        | TARGET PORT |            URL            |
|-----------|--------------------|-------------|---------------------------|
| default   | nodeserver-service | http/3000   | http://192.168.49.2:31139 |
|-----------|--------------------|-------------|---------------------------|
* Starting tunnel for service nodeserver-service.
|-----------|--------------------|-------------|------------------------|
| NAMESPACE |        NAME        | TARGET PORT |          URL           |
|-----------|--------------------|-------------|------------------------|
| default   | nodeserver-service |             | http://127.0.0.1:38397 |
|-----------|--------------------|-------------|------------------------|
```
In this example sending a GET to http://127.0.0.1:38397jobs would give the list of all jobs and so on.

# Explanations
## Project structure
I decided to go with Node instead of Python since I have less experience with it, and thought it would be interesting.
As time was limited, I decided to go with the simplest libraries/packages I could get away with, then do improvements later, so I am using [Express](https://expressjs.com/) as my web application framework, and [Multer](https://github.com/expressjs/multer) as the middleware to handle uploads. Finally, [sharp](https://github.com/lovell/sharp) to handle the image processing.

## Database
Going with the simplest solution, I decided to go with the simplest DB, sqlite. That would obviously be the first thing to improve when productionizing. Some SQL DB like MySQL would be suitable.

## Testing
The tests are written in jest and supertest and are definitely not satisfactory so far (will need more work).

## Job queue
The next thing to upgrade will be to use [Bull](https://github.com/OptimalBits/bull) to handle the job queuing.

## Logging
The final important upgrade will be to use [winston](https://github.com/winstonjs/winston) to do proper logging.

