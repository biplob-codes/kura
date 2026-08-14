use tiny_http::{Server,Header,Response};
pub fn start(){
    let app=Server::http("127.0.0.1:8000").expect("Failed to start server");
    for req in app.incoming_requests(){
        match req.url(){
            "/health"=>{
                 let res=Response::from_string("Server is healthy").with_status_code(200).with_header(cors_header());
               let _=  req.respond(res);
            }
            _ =>{
                let res=Response::from_string("Not found").with_status_code(404);
                let _=req.respond(res);
            }
        }
    }
}
fn cors_header() -> Header {
    Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap()
}