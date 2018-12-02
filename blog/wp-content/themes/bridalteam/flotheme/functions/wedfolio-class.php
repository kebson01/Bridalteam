<?php 
global $_wedfolio;

class Flotheme_WedFolio {

    public $user;
    public $tableName;

    // init
    public function __construct() {
        global $wpdb;

        // defines
        $this->user = wp_get_current_user();
        $this->tableName = $wpdb->prefix . "postlike";

        // if no like\love table
        $this->createTables();                

        // like button
        add_action('wp_ajax_flo_like_post', array($this, 'likePost'));
        add_action('wp_ajax_nopriv_flo_like_post', array($this, 'likePost'));                
        // love button 
        add_action('wp_ajax_flo_love_post', array($this, 'lovePost'));
        add_action('wp_ajax_nopriv_flo_love_post', array($this, 'lovePost'));         

        // add image to wedfolio
        add_action('wp_ajax_flo_wedfolio_add', array($this, 'addWedfolio'));
        add_action('wp_ajax_nopriv_flo_wedfolio_add', array($this, 'addWedfolio'));                
    }

    public function createTables() {
        global $wpdb;

        $wpdb->query( 
            $wpdb->prepare( 
                    "CREATE TABLE IF NOT EXISTS %s (
                      `meta_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
                      `post_id` bigint(20) unsigned NOT NULL DEFAULT '0',
                      `meta_action` varchar(255) DEFAULT NULL,
                      `user_id` bigint(20) unsigned NOT NULL DEFAULT '0',
                      PRIMARY KEY (`meta_id`),
                      KEY `post_id` (`post_id`),
                      KEY `meta_action` (`meta_action`)
                    )", $this->tableName                   
                )
        );
    }

    //
    public function getUser() {
        if ( $this->user->ID ) 
            return $this->user;
        else
            return false;
    }    

    // "love" ajax request 
    public function lovePost() {
        $pid = (int) stripslashes($_REQUEST['pid']);

        echo $this->postAddLike($pid,'love'); die;
    }    

    // "like" ajax request 
    public function likePost() {
        $pid = (int) stripslashes($_REQUEST['pid']);

        echo $this->postAddLike($pid,'like'); die;
    }

    // love\like adder
    public function postAddLike($pid=0, $act='like') {
        if (!$this->getUser()) return "Please login to use this function";

        if (!$pid) return "Something went wrong...";

        global $wpdb;

        $query = "SELECT COUNT(*) FROM " . $this->tableName . 
                " WHERE user_id = %d" . 
                " AND post_id = %d " . 
                " AND meta_action = %s";

        $liked  = $wpdb->get_var($wpdb->prepare($query, $this->getUser()->ID, $pid, 'like'));
        $loved  = $wpdb->get_var($wpdb->prepare($query, $this->getUser()->ID, $pid, 'love'));

        if ( !$liked && !$loved ) { 
            $wpdb->insert( 
                $this->tableName, 
                array( 
                    'post_id' => $pid,
                    'meta_action' => $act,
                    'user_id' => $this->getUser()->ID
                ), 
                array( 
                    '%d', 
                    '%s', 
                    '%d'
                ) 
            );       

            return "Success!";     
        } elseif ( ( 'love' == $act && $liked ) || ( 'like' == $act && $loved ) ) {
            $query = "UPDATE " . $this->tableName .
                " SET meta_action = %s" .
                " WHERE user_id = %d" . 
                " AND post_id = %d ";
            $wpdb->query( $wpdb->prepare( $query, $act, $this->getUser()->ID, $pid) );  

            return "Success! Updated.";
        } else {
            $query = "DELETE FROM " . $this->tableName . 
                " WHERE user_id = %d" . 
                " AND post_id = %d " . 
                " AND meta_action = %s";
            $wpdb->query( $wpdb->prepare( $query, $this->getUser()->ID, $pid, $act) );                     

            return "Like removed!";
        }
    }

    // return number of love\like
    public function getPostLikes($pid=0,$act='like') {
        global $wpdb;

        if ($pid == 0) return "Error, please specify the post";

        $query = "SELECT count(*) FROM " . $this->tableName . " WHERE post_id = %d AND meta_action = %s";

        $result = $wpdb->get_var($wpdb->prepare($query, $pid, $act));

        return $result;
    }

    public function isPostLiked($act='like', $pid=0) {
        if ($pid == 0) $pid = get_the_ID();

        if ( $this->checkPostLike($act,$pid) ) return "active";
        return;
    }

    // return number of love\like
    public function checkPostLike($act='like', $pid=0) {
        global $wpdb;

        if ($pid == 0) return "Error, please specify the post";

        if ($this->user->ID == 0) return "Error, please log in";

        $query = "SELECT count(*) FROM " . $this->tableName . " WHERE post_id = %d AND meta_action = %s AND user_id = %d";

        $result = $wpdb->get_var($wpdb->prepare($query, $pid, $act, $this->user->ID));

        return $result;
    }

    // 
    public function addWedfolio() {
        $img = $_REQUEST['src'];
        $category = (int) $_REQUEST['wedfolio-category'];
        $title = addslashes($_REQUEST['title']);
        if ($title == '') $title = 'Untitled';

        echo $this->addWedfolioImage($title, $img, $category); die;
    }  

    public function addWedfolioImage($title, $img, $category) {
        if (!$this->getUser()) { 
            return "Error, please login to use this function";
        }

        $args = array(
            'post_type'     => 'wedfolio',
            'post_status'   => 'publish',
            'post_author'   => $this->user->ID,
            'post_title'    => $title,
            'post_content'  => $img,
            'tax_input'     => array( 'wedfolio-category' => array($category) ),
        );

        $wedfolio_post = wp_insert_post( $args, false );
        
        if ($wedfolio_post) { 
            wp_set_object_terms( $wedfolio_post, $category, 'wedfolio-category' );
            return "Success!";
        } else {
            return "Error, something went wrong!";
        }
        
    }
}

$_wedfolio = new Flotheme_WedFolio(); 