//
//  ZPLPluginController.h
//  Zeplin
//
//  Created by K. Berk Cebi on 4/19/17.
//  Copyright © 2017 Zeplin, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface ZPLPluginController : NSObject

+ (BOOL)exportToApplicationWithBundleIdentifier:(NSString *)bundleIdentifier;

@end
