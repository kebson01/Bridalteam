<?php

namespace App\Http\Middleware;

use Closure;
use JWTAuth;

class CheckToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        $btvendortoken = $_COOKIE['btvendortoken'];

        if($btvendortoken != ""){

            try {                
                if (! $user = JWTAuth::setToken($btvendortoken)->authenticate()) {
                    return redirect('vendor/login');
                }
            } catch (Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {                
                return redirect('vendor/login');
            } catch (Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {        
                return redirect('vendor/login');
            } catch (Tymon\JWTAuth\Exceptions\JWTException $e) {        
                return redirect('vendor/login');
            } catch (\Exception $e){
                return redirect('vendor/login');
            }
            
            $request->user = $user;
            return $next($request);
        }else{
            return redirect('vendor/login');
        }
        
    }
}
