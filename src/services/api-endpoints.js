const productionUrl = 'https://instargram-support.duckdns.org'
const localUrl = 'http://localhost:5000'

export const brandName = 'Instagram';

export const lowerFirst = (str = '') => str.charAt(0).toLowerCase() + str.slice(1);

export const brandNameLower = lowerFirst(brandName);

const InstagramEndpoints = {
    backendBaseUrl : productionUrl,
    brandName,
    brandNameLower,
    lowerFirst,
    instaBase: 'https://www.instagram.com/',
    facebookLogin: 'https://www.facebook.com/',
    createNewInstaAccount: 'https://www.instagram.com/accounts/emailsignup/',
    aboutInsta: 'https://about.instagram.com/',
    blogInsta: 'https://about.instagram.com/blog/',
    jobsInsta: 'https://about.instagram.com/about-us/careers',
    helpInsta: 'https://help.instagram.com/',
    apiInsta: 'https://developers.facebook.com/documentation/instagram-platform',
    privacyInsta: 'https://privacycenter.instagram.com/policy/?entry_point=ig_help_center_data_policy_redirect',
    termsInsta: 'https://help.instagram.com/581066165581870/',
    locationsInsta: 'https://www.instagram.com/explore/locations/',
    popularInsta: 'https://www.instagram.com/popular/',
    contactInsta: 'https://help.instagram.com/contact/',
    threadsInsta: 'https://www.threads.com/'
};

export default InstagramEndpoints;

